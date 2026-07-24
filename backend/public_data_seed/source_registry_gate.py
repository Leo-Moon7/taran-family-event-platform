"""QA-023 synthetic, fail-closed registry gate.

This module never calls a network service or reads provider data.  A
PASS_CONTRACT result proves only that a synthetic contract is internally
complete; it never grants permission to call or store a real dataset.
"""

from __future__ import annotations

import copy
import hashlib
import json
import re
from pathlib import Path
from typing import Any


FIXTURE_PATH = Path(__file__).with_name("source_registry_gate_fixtures.json")

ALLOWED_REGISTRY_KEYS = {
    "portalDataId",
    "sourceFamilyId",
    "pmSelected",
    "termsPinned",
    "termsStatus",
    "schemaPinned",
    "format",
    "xmlSchemaPinned",
    "fieldMapPinned",
    "unknownFields",
    "forbiddenFields",
    "sourceKeyPinned",
    "endpointPinned",
    "endpointStatus",
    "paginationPinned",
    "quotaPinned",
    "filterPinned",
    "attributionPinned",
    "retentionPinned",
    "mirrorLineagePinned",
    "multipleActiveMirrors",
    "approvalGateSatisfied",
    "eventFitInferred",
    "publicProjectionFields",
    "sourceAsOfAccurate",
    "termsArtifactSha256",
    "sourceSchemaSha256",
    "allowedPhysicalFields",
    "forbiddenPhysicalFields",
    "sourceKeyFields",
}

BOOLEAN_REGISTRY_KEYS = {
    "pmSelected",
    "termsPinned",
    "schemaPinned",
    "xmlSchemaPinned",
    "fieldMapPinned",
    "sourceKeyPinned",
    "endpointPinned",
    "paginationPinned",
    "quotaPinned",
    "filterPinned",
    "attributionPinned",
    "retentionPinned",
    "mirrorLineagePinned",
    "multipleActiveMirrors",
    "approvalGateSatisfied",
    "eventFitInferred",
    "sourceAsOfAccurate",
}

LIST_REGISTRY_KEYS = {
    "unknownFields",
    "forbiddenFields",
    "publicProjectionFields",
    "allowedPhysicalFields",
    "forbiddenPhysicalFields",
    "sourceKeyFields",
}

ALLOWED_PORTAL_IDS = {
    "15154916",
    "15154897",
    "15155090",
    "15155124",
    "15155138",
    "15154918",
    "15155252",
    "15155159",
    "15154966",
    "15154970",
    "15122367",
}

PUBLIC_PROJECTION_FIELDS = {"published", "verified", "inquiryEnabled"}
INFERRED_FIELDS = {
    "eventFit",
    "eventAvailable",
    "price",
    "rating",
    "review",
    "reviewCount",
    "recommendation",
    "searchRank",
}
ALWAYS_FORBIDDEN_FIELDS = {
    "representativeName",
    "ownerName",
    "phone",
    "fax",
    "email",
    "homepage",
    "businessNumber",
    "businessNumberHash",
    "coordinates",
    "latitude",
    "longitude",
    "photo",
    "logo",
    "menu",
}
SENSITIVE_VALUE_PATTERNS = (
    re.compile(r"(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b"),
    re.compile(r"\b0\d{1,2}-?\d{3,4}-?\d{4}\b"),
    re.compile(r"\b\d{3}-?\d{2}-?\d{5}\b"),
)

ERROR_ORDER = (
    "BE009_E_SOURCE_EXCLUDED",
    "BE009_E_PM_SELECTION",
    "BE009_E_XML_SCHEMA",
    "BE009_E_TERMS_PIN",
    "BE009_E_TERMS_EXPIRED",
    "BE009_E_SCHEMA_PIN",
    "BE009_E_FIELD_MAP",
    "BE009_E_FORBIDDEN_FIELD",
    "BE009_E_SOURCE_KEY",
    "BE009_E_ENDPOINT_UNKNOWN",
    "BE009_E_ENDPOINT_REPLACED",
    "BE009_E_PAGINATION_UNKNOWN",
    "BE009_E_QUOTA_UNKNOWN",
    "BE009_E_FILTER_UNKNOWN",
    "BE009_E_ATTRIBUTION_UNKNOWN",
    "BE009_E_RETENTION_UNKNOWN",
    "BE009_E_MIRROR_LINEAGE",
    "BE009_E_APPROVAL_REQUIRED",
    "BE009_E_PUBLIC_PROJECTION",
    "BE009_E_EVENT_FIT_INFERENCE",
    "BE009_E_SOURCE_AS_OF",
)


def load_bundle(path: Path = FIXTURE_PATH) -> dict[str, Any]:
    with path.open(encoding="utf-8") as stream:
        return json.load(stream)


def materialize_fixture(bundle: dict[str, Any], fixture: dict[str, Any]) -> dict[str, Any]:
    profile_name = fixture["profile"]
    if profile_name not in bundle["profiles"]:
        raise ValueError(f"unknown fixture profile: {profile_name}")
    materialized = copy.deepcopy(fixture)
    registry = copy.deepcopy(bundle["profiles"][profile_name])
    registry.update(copy.deepcopy(fixture.get("registryOverrides", {})))
    registry["portalDataId"] = fixture.get(
        "portalDataId", registry.get("portalDataId", "SYNTHETIC-DEFAULT")
    )
    registry.setdefault("sourceFamilyId", "synthetic-official")
    materialized["registry"] = registry
    defaults = copy.deepcopy(bundle.get("profileArtifacts", {}).get(profile_name, {}))
    for artifact_name in ("termsArtifact", "sourceSchemaArtifact"):
        if artifact_name in fixture:
            materialized[artifact_name] = copy.deepcopy(fixture[artifact_name])
        elif artifact_name in defaults:
            materialized[artifact_name] = defaults[artifact_name]
    return materialized


def _ordered(codes: set[str]) -> list[str]:
    unknown = codes.difference(ERROR_ORDER)
    if unknown:
        return [*ERROR_ORDER, *sorted(unknown)]
    return [code for code in ERROR_ORDER if code in codes]


def evaluate(fixture: dict[str, Any]) -> dict[str, Any]:
    errors: set[str] = set()
    registry_value = fixture.get("registry")
    if not isinstance(registry_value, dict):
        registry: dict[str, Any] = {}
        errors.add("BE009_E_FIELD_MAP")
    else:
        registry = registry_value

    if set(registry).difference(ALLOWED_REGISTRY_KEYS):
        errors.add("BE009_E_FIELD_MAP")
    if any(key in registry and type(registry[key]) is not bool for key in BOOLEAN_REGISTRY_KEYS):
        errors.add("BE009_E_FIELD_MAP")
    if any(key in registry and not isinstance(registry[key], list) for key in LIST_REGISTRY_KEYS):
        errors.add("BE009_E_FIELD_MAP")
    if any(
        key in registry
        and isinstance(registry[key], list)
        and any(not isinstance(value, str) or not value for value in registry[key])
        for key in LIST_REGISTRY_KEYS
    ):
        errors.add("BE009_E_FIELD_MAP")
    input_records_value = fixture.get("inputRecords", [])
    if not isinstance(input_records_value, list):
        errors.add("BE009_E_FIELD_MAP")
        input_records: list[Any] = []
    else:
        input_records = input_records_value

    portal_value = registry.get("portalDataId")
    source_family_value = registry.get("sourceFamilyId")
    portal_id = portal_value if isinstance(portal_value, str) else ""
    source_family = source_family_value.lower() if isinstance(source_family_value, str) else ""
    is_synthetic_portal = portal_id.startswith("SYNTHETIC-")
    if (
        not portal_id
        or not source_family
        or portal_id == "15012005"
        or (portal_id not in ALLOWED_PORTAL_IDS and not is_synthetic_portal)
        or "naver" in source_family
        or "hold" in source_family
    ):
        errors.add("BE009_E_SOURCE_EXCLUDED")
    if not registry.get("pmSelected", False):
        errors.add("BE009_E_PM_SELECTION")
    if registry.get("format") == "XML" and not registry.get("xmlSchemaPinned", False):
        errors.add("BE009_E_XML_SCHEMA")
    terms_status = registry.get("termsStatus")
    terms_artifact = fixture.get("termsArtifact")
    terms_artifact_shape_ok = (
        isinstance(terms_artifact, dict)
        and set(terms_artifact) == {"bytes", "sha256"}
    )
    terms_content = terms_artifact.get("bytes") if isinstance(terms_artifact, dict) else None
    terms_declared_hash = terms_artifact.get("sha256") if isinstance(terms_artifact, dict) else None
    terms_computed_hash = (
        hashlib.sha256(terms_content.encode("utf-8")).hexdigest()
        if isinstance(terms_content, str)
        else None
    )
    terms_hash_ok = (
        terms_artifact_shape_ok
        and isinstance(registry.get("termsArtifactSha256"), str)
        and isinstance(terms_declared_hash, str)
        and terms_declared_hash == terms_computed_hash
        and registry.get("termsArtifactSha256") == terms_computed_hash
    )
    if (
        not registry.get("termsPinned", False)
        or terms_status not in {"approved", "expired", "revoked"}
        or not terms_hash_ok
    ):
        errors.add("BE009_E_TERMS_PIN")
    if terms_status in {"expired", "revoked"}:
        errors.add("BE009_E_TERMS_EXPIRED")
    schema_artifact = fixture.get("sourceSchemaArtifact")
    schema_artifact_shape_ok = (
        isinstance(schema_artifact, dict)
        and set(schema_artifact) == {"bytes", "sha256"}
    )
    schema_content = schema_artifact.get("bytes") if isinstance(schema_artifact, dict) else None
    schema_declared_hash = schema_artifact.get("sha256") if isinstance(schema_artifact, dict) else None
    schema_computed_hash = (
        hashlib.sha256(schema_content.encode("utf-8")).hexdigest()
        if isinstance(schema_content, str)
        else None
    )
    schema_payload: Any = None
    try:
        schema_payload = json.loads(schema_content) if isinstance(schema_content, str) else None
    except json.JSONDecodeError:
        schema_payload = None
    schema_payload_fields = (
        schema_payload.get("fields")
        if isinstance(schema_payload, dict)
        else None
    )
    schema_payload_ok = (
        isinstance(schema_payload_fields, list)
        and bool(schema_payload_fields)
        and all(isinstance(value, str) and value for value in schema_payload_fields)
    )
    schema_hash_ok = (
        schema_artifact_shape_ok
        and schema_payload_ok
        and isinstance(registry.get("sourceSchemaSha256"), str)
        and isinstance(schema_declared_hash, str)
        and schema_declared_hash == schema_computed_hash
        and registry.get("sourceSchemaSha256") == schema_computed_hash
    )
    if (
        not registry.get("schemaPinned", False)
        or registry.get("format") not in {"JSON", "XML"}
        or not schema_hash_ok
    ):
        errors.add("BE009_E_SCHEMA_PIN")

    allowed_fields_value = registry.get("allowedPhysicalFields")
    forbidden_fields_value = registry.get("forbiddenPhysicalFields")
    allowed_fields = set(allowed_fields_value) if isinstance(allowed_fields_value, list) else set()
    forbidden_fields = set(forbidden_fields_value) if isinstance(forbidden_fields_value, list) else set()
    schema_fields = set(schema_payload_fields) if schema_payload_ok else set()
    schema_map_complete = (
        bool(allowed_fields)
        and allowed_fields.issubset(schema_fields)
        and schema_fields.issubset(allowed_fields | forbidden_fields)
    )
    if (
        not registry.get("fieldMapPinned", False)
        or registry.get("unknownFields")
        or not schema_map_complete
    ):
        errors.add("BE009_E_FIELD_MAP")
    if registry.get("forbiddenFields"):
        errors.add("BE009_E_FORBIDDEN_FIELD")
    source_key_fields_value = registry.get("sourceKeyFields")
    source_key_fields = (
        list(source_key_fields_value)
        if isinstance(source_key_fields_value, list)
        else []
    )
    if not registry.get("sourceKeyPinned", False) or not source_key_fields:
        errors.add("BE009_E_SOURCE_KEY")
    endpoint_status = registry.get("endpointStatus")
    if not registry.get("endpointPinned", False) or endpoint_status not in {"active", "ended", "replaced"}:
        errors.add("BE009_E_ENDPOINT_UNKNOWN")
    if endpoint_status in {"ended", "replaced"}:
        errors.add("BE009_E_ENDPOINT_REPLACED")
    if not registry.get("paginationPinned", False):
        errors.add("BE009_E_PAGINATION_UNKNOWN")
    if not registry.get("quotaPinned", False):
        errors.add("BE009_E_QUOTA_UNKNOWN")
    if not registry.get("filterPinned", False):
        errors.add("BE009_E_FILTER_UNKNOWN")
    if not registry.get("attributionPinned", False):
        errors.add("BE009_E_ATTRIBUTION_UNKNOWN")
    if not registry.get("retentionPinned", False):
        errors.add("BE009_E_RETENTION_UNKNOWN")
    if not registry.get("mirrorLineagePinned", False) or registry.get("multipleActiveMirrors", False):
        errors.add("BE009_E_MIRROR_LINEAGE")
    if not registry.get("approvalGateSatisfied", False):
        errors.add("BE009_E_APPROVAL_REQUIRED")
    if registry.get("publicProjectionFields"):
        errors.add("BE009_E_PUBLIC_PROJECTION")
    if registry.get("eventFitInferred", False):
        errors.add("BE009_E_EVENT_FIT_INFERENCE")
    if not registry.get("sourceAsOfAccurate", False):
        errors.add("BE009_E_SOURCE_AS_OF")

    seen_source_keys: set[tuple[Any, ...]] = set()
    for record_index, record in enumerate(input_records):
        if not isinstance(record, dict):
            errors.add("BE009_E_FIELD_MAP")
            continue
        if any(
            not isinstance(value, (str, int, float, bool)) and value is not None
            for value in record.values()
        ):
            errors.add("BE009_E_FIELD_MAP")
        record_fields = set(record)
        if record_fields & PUBLIC_PROJECTION_FIELDS:
            errors.add("BE009_E_PUBLIC_PROJECTION")
        if record_fields & INFERRED_FIELDS:
            errors.add("BE009_E_EVENT_FIT_INFERENCE")
        effective_forbidden_fields = forbidden_fields | ALWAYS_FORBIDDEN_FIELDS
        if record_fields & effective_forbidden_fields:
            errors.add("BE009_E_FORBIDDEN_FIELD")
        unknown_record_fields = (
            record_fields
            - allowed_fields
            - effective_forbidden_fields
            - PUBLIC_PROJECTION_FIELDS
            - INFERRED_FIELDS
        )
        if unknown_record_fields:
            errors.add("BE009_E_FIELD_MAP")
        if any(
            pattern.search(str(value))
            for value in record.values()
            if value is not None
            for pattern in SENSITIVE_VALUE_PATTERNS
        ):
            errors.add("BE009_E_FORBIDDEN_FIELD")
        if source_key_fields:
            source_key = tuple(record.get(field) for field in source_key_fields)
            source_key_is_scalar = all(
                isinstance(value, (str, int, float))
                and not isinstance(value, bool)
                for value in source_key
            )
            if (
                not source_key_is_scalar
                or any(value == "" for value in source_key)
                or source_key in seen_source_keys
            ):
                errors.add("BE009_E_SOURCE_KEY")
            else:
                seen_source_keys.add(source_key)

    error_codes = _ordered(errors)
    passed = not error_codes
    candidate_count = len(fixture.get("inputRecords", [])) if passed else 0
    return {
        "status": "PASS_CONTRACT" if passed else "BLOCKED_REGISTRY",
        "errorCodes": error_codes,
        "be006ProjectionEligible": False,
        "datasetExecutionApproved": False,
        "candidateCount": candidate_count,
        "candidateStates": ["match_pending"] * candidate_count,
        "publicProjectionCount": 0,
        "sensitiveValueOutputCount": 0,
    }


def expected_error_codes(bundle: dict[str, Any], expected: dict[str, Any]) -> list[str]:
    if "errorAlias" in expected:
        return list(bundle["errorAliases"][expected["errorAlias"]])
    return list(expected.get("errorCodes", []))


def verify_fixture(bundle: dict[str, Any], fixture: dict[str, Any]) -> dict[str, Any]:
    materialized = materialize_fixture(bundle, fixture)
    actual = evaluate(materialized)
    expected = fixture["expected"]
    checks = {
        "status": expected["status"],
        "errorCodes": expected_error_codes(bundle, expected),
        "be006ProjectionEligible": expected["be006ProjectionEligible"],
        "datasetExecutionApproved": expected["datasetExecutionApproved"],
        "candidateCount": expected["candidateCount"],
        "publicProjectionCount": expected["publicProjectionCount"],
        "sensitiveValueOutputCount": expected["sensitiveValueOutputCount"],
    }
    mismatches = {
        key: {"expected": value, "actual": actual.get(key)}
        for key, value in checks.items()
        if actual.get(key) != value
    }
    return {"fixtureId": fixture["fixtureId"], "passed": not mismatches, "mismatches": mismatches}


def run_bundle(bundle: dict[str, Any]) -> list[dict[str, Any]]:
    return [verify_fixture(bundle, fixture) for fixture in bundle["fixtures"]]


def main() -> int:
    bundle = load_bundle()
    results = run_bundle(bundle)
    failed = [result for result in results if not result["passed"]]
    summary = {
        "fixtureCount": len(results),
        "passed": len(results) - len(failed),
        "failed": len(failed),
        "realDatasetExecutionApproved": 0,
        "publicProjectionCount": 0,
    }
    print(json.dumps(summary, ensure_ascii=False, sort_keys=True))
    if failed:
        print(json.dumps(failed, ensure_ascii=False, indent=2, sort_keys=True))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
