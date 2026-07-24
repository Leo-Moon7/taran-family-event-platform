from __future__ import annotations

import copy
import hashlib
import json
import shutil
import time
import unittest
import uuid
from pathlib import Path

from backend.public_data_seed.seed_tool import (
    ALL_OUTPUT_NAMES,
    BatchFatal,
    canonical_bytes,
    run_batch,
    sha256_bytes,
)


FIELD_MAP = [
    {"physical": "MGTNO", "logical": "sourceRecordKey", "required": True, "valueType": "string"},
    {"physical": "BPLCNM", "logical": "businessName", "required": True, "valueType": "string"},
    {"physical": "RDNWHLADDR", "logical": "roadAddress", "required": False, "valueType": "string"},
    {"physical": "TRDSTATENM", "logical": "administrativeStatusName", "required": False, "valueType": "string"},
    {"physical": "UPTAENM", "logical": "industryName", "required": False, "valueType": "string"},
    {"physical": "APVPERMYMD", "logical": "licenseDate", "required": False, "valueType": "date"},
    {"physical": "LASTMODTS", "logical": "sourceLastModifiedAt", "required": False, "valueType": "datetime"},
]


def deterministic_suffix(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:12]


class SeedToolTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_parent = Path(__file__).with_name(".test-work")
        self.temp_parent.mkdir(exist_ok=True)
        self.root = self.temp_parent / uuid.uuid4().hex
        self.root.mkdir()
        (self.root / "registry").mkdir()
        (self.root / "input").mkdir()
        (self.root / "output").mkdir()
        self.schema = {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "type": "object",
            "additionalProperties": False,
            "required": [
                "registryId",
                "registryVersion",
                "contractVersion",
                "status",
                "validFrom",
                "validUntil",
                "reviewedAt",
                "reviewedBy",
                "approvalReference",
                "datasets",
            ],
            "properties": {
                key: {"type": "string"}
                for key in (
                    "registryId",
                    "registryVersion",
                    "contractVersion",
                    "status",
                    "validFrom",
                    "validUntil",
                    "reviewedAt",
                    "reviewedBy",
                    "approvalReference",
                )
            },
            "$defs": {
                "fieldMap": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["physical", "logical", "required", "valueType"],
                    "properties": {
                        "physical": {"type": "string"},
                        "logical": {"type": "string"},
                        "required": {"type": "boolean"},
                        "valueType": {"type": "string"},
                    },
                },
                "dataset": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "datasetId",
                        "portalDataId",
                        "status",
                        "terms",
                        "sourceSchemaVersion",
                        "sourceSchemaSha256",
                        "recordPath",
                        "fieldMap",
                        "forbiddenPhysicalFields",
                    ],
                    "properties": {
                        key: {"type": "string"}
                        for key in (
                            "datasetId",
                            "portalDataId",
                            "status",
                            "terms",
                            "sourceSchemaVersion",
                            "sourceSchemaSha256",
                            "recordPath",
                            "fieldMap",
                            "forbiddenPhysicalFields",
                        )
                    },
                },
            },
        }
        self.schema["properties"]["datasets"] = {"type": "array"}
        self.registry = {
            "registryId": "sonpum-source-registry",
            "registryVersion": "1.0.0",
            "contractVersion": "BE-006-v1",
            "status": "approved",
            "validFrom": "2026-07-01T00:00:00+09:00",
            "validUntil": "2026-12-31T23:59:59+09:00",
            "reviewedAt": "2026-06-30T00:00:00+09:00",
            "reviewedBy": "synthetic-reviewer",
            "approvalReference": "D-23",
            "datasets": [
                {
                    "datasetId": "synthetic-seoul-food",
                    "portalDataId": "15154916",
                    "status": "approved",
                    "terms": {
                        "termsSnapshotId": "terms-synthetic-v1",
                        "status": "approved",
                        "decision": "approved",
                        "validFrom": "2026-07-01T00:00:00+09:00",
                        "validUntil": "2026-12-31T23:59:59+09:00",
                        "reviewedAt": "2026-06-30T00:00:00+09:00",
                        "reviewedBy": "synthetic-reviewer",
                        "officialUrl": "https://www.data.go.kr/",
                        "commercialUseAllowed": True,
                        "derivativeAllowed": True,
                    },
                    "sourceSchemaVersion": "synthetic-v1",
                    "sourceSchemaSha256": "a" * 64,
                    "recordPath": "$.records",
                    "fieldMap": FIELD_MAP,
                    "forbiddenPhysicalFields": ["SITETEL", "OWNERNAME", "BUSINESS_NUMBER"],
                }
            ],
        }
        self.records = [
            {
                "MGTNO": "SYN-001",
                "BPLCNM": "가족 연회장",
                "RDNWHLADDR": "서울특별시 중구 테스트로 1",
                "TRDSTATENM": "영업",
                "UPTAENM": "한식",
                "APVPERMYMD": "2020-01-02",
                "LASTMODTS": "2026-07-23T12:00:00+09:00",
            }
        ]
        self._write_case(self.records)

    def tearDown(self) -> None:
        shutil.rmtree(self.root, ignore_errors=True)
        try:
            self.temp_parent.rmdir()
        except OSError:
            pass

    def _jsonl_bytes(self, records: list[dict]) -> bytes:
        return b"".join(canonical_bytes(record) + b"\n" for record in records)

    def _write_case(
        self,
        records: list[dict],
        *,
        batch_id: str = "synthetic-batch-001",
        registry: dict | None = None,
        input_path: str = "input/batch.jsonl",
    ) -> None:
        registry_value = copy.deepcopy(registry or self.registry)
        schema_bytes = canonical_bytes(self.schema)
        registry_bytes = canonical_bytes(registry_value)
        (self.root / "registry" / "approved-source-registry.schema.json").write_bytes(schema_bytes)
        (self.root / "registry" / "approved-source-registry.json").write_bytes(registry_bytes)
        input_bytes = self._jsonl_bytes(records)
        target = self.root / input_path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(input_bytes)
        self.registry_hash = sha256_bytes(registry_bytes)
        self.manifest = {
            "contractVersion": "BE-006-v1",
            "batchId": batch_id,
            "clock": {"timezone": "Asia/Seoul", "frozenAt": "2026-07-24T00:00:00+09:00"},
            "registry": {
                "path": "registry/approved-source-registry.json",
                "schemaPath": "registry/approved-source-registry.schema.json",
                "sha256": self.registry_hash,
                "schemaSha256": sha256_bytes(schema_bytes),
            },
            "dataset": {
                "portalDataId": "15154916",
                "datasetId": "synthetic-seoul-food",
                "termsSnapshotId": "terms-synthetic-v1",
                "sourceSchemaVersion": "synthetic-v1",
                "sourceSchemaSha256": "a" * 64,
            },
            "input": {
                "path": input_path,
                "sha256": sha256_bytes(input_bytes),
                "recordEncoding": "utf-8",
                "lineEnding": "lf",
                "sourceAsOf": "2026-07-23",
            },
            "output": {"runsRoot": "output/runs", "expectedBundleVersion": "BE-007-output-v1"},
            "parserVersion": "be007-v1",
            "createdAt": "2026-07-24T00:00:00+09:00",
            "purpose": "discovery",
            "dryRun": True,
        }
        (self.root / "manifest.json").write_bytes(canonical_bytes(self.manifest))

    def _save_manifest(self) -> None:
        (self.root / "manifest.json").write_bytes(canonical_bytes(self.manifest))

    def _run(self):
        return run_batch(self.root, "manifest.json", self.registry_hash)

    def test_normal_bundle_is_private_and_reconciled(self):
        response = self._run()
        self.assertFalse(response["reused"])
        bundle = self.root / response["bundlePath"]
        self.assertEqual(set(ALL_OUTPUT_NAMES), {path.name for path in bundle.iterdir()})
        result = json.loads((bundle / "manifest-result.json").read_text(encoding="utf-8"))
        self.assertEqual(result["counts"]["accepted"], 1)
        self.assertTrue(result["reconciliationPassed"])
        combined = b"".join((bundle / name).read_bytes() for name in ALL_OUTPUT_NAMES)
        for forbidden in (
            b'"published":true',
            b'"verified":true',
            b'"inquiryEnabled":true',
            b"business_number",
            b"rating",
            b"reviewCount",
            b"price",
        ):
            self.assertNotIn(forbidden, combined)

    def test_reexecution_reuses_immutable_bundle(self):
        first = self._run()
        bundle = self.root / first["bundlePath"]
        before = {path.name: (path.read_bytes(), path.stat().st_mtime_ns) for path in bundle.iterdir()}
        time.sleep(0.01)
        second = self._run()
        after = {path.name: (path.read_bytes(), path.stat().st_mtime_ns) for path in bundle.iterdir()}
        self.assertTrue(second["reused"])
        self.assertEqual(before, after)

    def test_unknown_and_personal_fields_are_quarantined_without_values(self):
        self._write_case(
            [
                {
                    "MGTNO": "SYN-002",
                    "BPLCNM": "비공개 값",
                    "SITETEL": "010-1234-5678",
                    "UNKNOWN": "do-not-copy",
                }
            ],
            batch_id="synthetic-batch-002",
        )
        response = self._run()
        bundle = self.root / response["bundlePath"]
        quarantined = (bundle / "observations.quarantined.jsonl").read_text(encoding="utf-8")
        errors = (bundle / "errors.jsonl").read_text(encoding="utf-8")
        self.assertIn("BE007_E_PERSONAL_DATA", errors)
        self.assertIn("BE007_E_FIELD_NOT_ALLOWED", errors)
        self.assertNotIn("010-1234-5678", quarantined + errors)
        self.assertNotIn("do-not-copy", quarantined + errors)

    def test_business_number_and_naver_stop_batch(self):
        for field, value, code in (
            ("BUSINESS_NUMBER", "123-45-67890", "BE007_E_BUSINESS_NUMBER"),
            ("NAVER_URL", "https://naver.com/example", "BE007_E_LEGACY_NAVER_SOURCE"),
        ):
            with self.subTest(code=code):
                self._write_case(
                    [{"MGTNO": "SYN-X", "BPLCNM": "테스트", field: value}],
                    batch_id=f"synthetic-{code.lower().replace('_', '-')}"[:63],
                )
                with self.assertRaises(BatchFatal) as caught:
                    self._run()
                self.assertEqual(code, caught.exception.code)

    def test_expired_terms_stop_batch(self):
        registry = copy.deepcopy(self.registry)
        registry["datasets"][0]["terms"]["validUntil"] = "2026-07-23T23:59:59+09:00"
        self._write_case(self.records, batch_id="synthetic-expired-terms", registry=registry)
        with self.assertRaises(BatchFatal) as caught:
            self._run()
        self.assertEqual("BE007_E_TERMS_MISSING_OR_EXPIRED", caught.exception.code)

    def test_input_hash_and_path_escape_stop_batch(self):
        self.manifest["input"]["sha256"] = "f" * 64
        self._save_manifest()
        with self.assertRaises(BatchFatal) as caught:
            self._run()
        self.assertEqual("BE007_E_INPUT_HASH", caught.exception.code)
        self._write_case(self.records, batch_id="synthetic-path-escape")
        self.manifest["input"]["path"] = "../outside.jsonl"
        self._save_manifest()
        with self.assertRaises(BatchFatal) as caught:
            self._run()
        self.assertEqual("BE007_E_PATH_OUTSIDE_WORKDIR", caught.exception.code)

    def test_identical_duplicate_keeps_first_and_conflict_quarantines_all(self):
        same = self.records[0]
        self._write_case([same, same], batch_id="synthetic-duplicate-same")
        response = self._run()
        result = json.loads(
            (self.root / response["bundlePath"] / "manifest-result.json").read_text(encoding="utf-8")
        )
        self.assertEqual((1, 1, 1), (result["counts"]["accepted"], result["counts"]["quarantined"], result["counts"]["candidates"]))
        conflict = copy.deepcopy(same)
        conflict["BPLCNM"] = "다른 상호"
        self._write_case([same, conflict], batch_id="synthetic-duplicate-conflict")
        response = self._run()
        result = json.loads(
            (self.root / response["bundlePath"] / "manifest-result.json").read_text(encoding="utf-8")
        )
        self.assertEqual((0, 2, 0), (result["counts"]["accepted"], result["counts"]["quarantined"], result["counts"]["candidates"]))

    def test_empty_batch_is_anomaly_not_deletion(self):
        self._write_case([], batch_id="synthetic-empty-batch")
        response = self._run()
        self.assertEqual("anomaly", response["bundleStatus"])
        bundle = self.root / response["bundlePath"]
        self.assertIn("BE007_E_EMPTY_BATCH_ANOMALY", (bundle / "errors.jsonl").read_text(encoding="utf-8"))

    def test_placeholder_schema_and_invalid_registry_are_rejected(self):
        (self.root / "registry" / "approved-source-registry.schema.json").write_bytes(canonical_bytes({}))
        self.manifest["registry"]["schemaSha256"] = sha256_bytes(canonical_bytes({}))
        self._save_manifest()
        with self.assertRaises(BatchFatal) as caught:
            self._run()
        self.assertEqual("BE007_E_REGISTRY_SCHEMA", caught.exception.code)

        mutations = (
            ("registryVersion", "not-semver"),
            ("reviewedBy", ""),
        )
        for field, value in mutations:
            with self.subTest(field=field):
                registry = copy.deepcopy(self.registry)
                registry[field] = value
                self._write_case(
                    self.records,
                    batch_id=f"synthetic-invalid-{field.lower()}",
                    registry=registry,
                )
                with self.assertRaises(BatchFatal) as caught:
                    self._run()
                self.assertEqual("BE007_E_REGISTRY_SCHEMA", caught.exception.code)

        registry = copy.deepcopy(self.registry)
        registry["datasets"][0]["terms"]["officialUrl"] = "not-a-url"
        registry["datasets"][0]["fieldMap"][1]["logical"] = ""
        self._write_case(self.records, batch_id="synthetic-invalid-nested", registry=registry)
        with self.assertRaises(BatchFatal) as caught:
            self._run()
        self.assertEqual("BE007_E_REGISTRY_SCHEMA", caught.exception.code)

    def test_invalid_source_as_of_is_rejected(self):
        self.manifest["input"]["sourceAsOf"] = "2026-99-99"
        self._save_manifest()
        with self.assertRaises(BatchFatal) as caught:
            self._run()
        self.assertEqual("BE007_E_SCHEMA_MISMATCH", caught.exception.code)

    def test_sensitive_values_and_sensitive_unknown_field_name_do_not_leak(self):
        sensitive_cases = (
            ("MGTNO", "123-45-67890", "BE007_E_BUSINESS_NUMBER"),
            ("BPLCNM", "담당 010-1234-5678", "BE007_E_PERSONAL_DATA"),
            ("BPLCNM", "contact@example.com", "BE007_E_PERSONAL_DATA"),
        )
        for field, value, code in sensitive_cases:
            with self.subTest(code=code, field=field):
                record = copy.deepcopy(self.records[0])
                record[field] = value
                self._write_case(
                    [record],
                    batch_id=f"synthetic-sensitive-{deterministic_suffix(value)}",
                )
                if code == "BE007_E_BUSINESS_NUMBER":
                    with self.assertRaises(BatchFatal) as caught:
                        self._run()
                    self.assertEqual(code, caught.exception.code)
                else:
                    response = self._run()
                    bundle = self.root / response["bundlePath"]
                    combined = b"".join((bundle / name).read_bytes() for name in ALL_OUTPUT_NAMES)
                    self.assertNotIn(value.encode("utf-8"), combined)
                    self.assertIn(code.encode("utf-8"), combined)

        sensitive_key = "leak@example.com"
        record = copy.deepcopy(self.records[0])
        record[sensitive_key] = "hidden-value"
        self._write_case([record], batch_id="synthetic-sensitive-field")
        response = self._run()
        bundle = self.root / response["bundlePath"]
        combined = b"".join((bundle / name).read_bytes() for name in ALL_OUTPUT_NAMES)
        self.assertNotIn(sensitive_key.encode("utf-8"), combined)
        self.assertNotIn(b"hidden-value", combined)
        self.assertIn(b"unapprovedField", combined)

    def test_tampered_manifest_result_is_collision(self):
        first = self._run()
        bundle = self.root / first["bundlePath"]
        manifest_path = bundle / "manifest-result.json"
        value = json.loads(manifest_path.read_text(encoding="utf-8"))
        value["outputFiles"] = []
        value["counts"]["accepted"] = 999
        value["reconciliationPassed"] = False
        value["safeExitCode"] = 2
        manifest_path.write_bytes(canonical_bytes(value) + b"\n")
        with self.assertRaises(BatchFatal) as caught:
            self._run()
        self.assertEqual("BE007_E_OUTPUT_COLLISION", caught.exception.code)

    def test_coordinated_payload_and_manifest_tampering_is_collision(self):
        first = self._run()
        bundle = self.root / first["bundlePath"]
        quality_path = bundle / "quality-summary.json"
        manifest_path = bundle / "manifest-result.json"
        quality = json.loads(quality_path.read_text(encoding="utf-8"))
        quality["counts"]["accepted"] = 999
        quality_path.write_bytes(canonical_bytes(quality) + b"\n")
        manifest_value = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest_value["counts"]["accepted"] = 999
        for item in manifest_value["outputFiles"]:
            if item["name"] == "quality-summary.json":
                item["sha256"] = sha256_bytes(quality_path.read_bytes())
        manifest_path.write_bytes(canonical_bytes(manifest_value) + b"\n")
        with self.assertRaises(BatchFatal) as caught:
            self._run()
        self.assertEqual("BE007_E_OUTPUT_COLLISION", caught.exception.code)

        self._write_case(self.records, batch_id="synthetic-payload-tamper")
        second = self._run()
        bundle = self.root / second["bundlePath"]
        accepted_path = bundle / "observations.accepted.jsonl"
        accepted = json.loads(accepted_path.read_text(encoding="utf-8"))
        accepted["mappedFields"]["businessName"] = "변조 업체"
        accepted_path.write_bytes(canonical_bytes(accepted) + b"\n")
        manifest_path = bundle / "manifest-result.json"
        manifest_value = json.loads(manifest_path.read_text(encoding="utf-8"))
        for item in manifest_value["outputFiles"]:
            if item["name"] == "observations.accepted.jsonl":
                item["sha256"] = sha256_bytes(accepted_path.read_bytes())
        manifest_path.write_bytes(canonical_bytes(manifest_value) + b"\n")
        with self.assertRaises(BatchFatal) as caught:
            self._run()
        self.assertEqual("BE007_E_OUTPUT_COLLISION", caught.exception.code)

    def test_output_collision_never_overwrites(self):
        first = self._run()
        bundle = self.root / first["bundlePath"]
        original = (bundle / "manifest-result.json").read_bytes()
        manifest_result = json.loads(original)
        manifest_result["batchFingerprint"] = "0" * 64
        (bundle / "manifest-result.json").write_bytes(canonical_bytes(manifest_result) + b"\n")
        with self.assertRaises(BatchFatal) as caught:
            self._run()
        self.assertEqual("BE007_E_OUTPUT_COLLISION", caught.exception.code)
        self.assertEqual(canonical_bytes(manifest_result) + b"\n", (bundle / "manifest-result.json").read_bytes())


if __name__ == "__main__":
    unittest.main()
