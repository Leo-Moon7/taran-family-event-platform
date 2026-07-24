from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import source_registry_gate as gate


class SourceRegistryGateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.bundle = gate.load_bundle()
        cls.fixtures = cls.bundle["fixtures"]

    def test_fixture_groups_and_ids_are_exact(self) -> None:
        ids = [fixture["fixtureId"] for fixture in self.fixtures]
        self.assertEqual(len(ids), 31)
        self.assertEqual(len(set(ids)), 31)
        self.assertEqual(sum(value.startswith("BE009-CUR-") for value in ids), 11)
        self.assertEqual(sum(value.startswith("BE009-SYN-") for value in ids), 2)
        self.assertEqual(sum(value.startswith("BE009-NEG-") for value in ids), 18)
        current_portal_ids = [
            fixture["portalDataId"]
            for fixture in self.fixtures
            if fixture["fixtureId"].startswith("BE009-CUR-")
        ]
        self.assertEqual(
            current_portal_ids,
            [
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
            ],
        )

    def test_all_declared_fixtures_match_exact_expectations(self) -> None:
        results = gate.run_bundle(self.bundle)
        self.assertEqual([result for result in results if not result["passed"]], [])

    def test_current_entries_are_all_blocked(self) -> None:
        current = [
            gate.evaluate(gate.materialize_fixture(self.bundle, fixture))
            for fixture in self.fixtures
            if fixture["fixtureId"].startswith("BE009-CUR-")
        ]
        self.assertEqual(len(current), 11)
        self.assertTrue(all(result["status"] == "BLOCKED_REGISTRY" for result in current))
        self.assertTrue(all(result["be006ProjectionEligible"] is False for result in current))

    def test_synthetic_pass_never_grants_real_execution_or_publication(self) -> None:
        synthetic = [
            gate.evaluate(gate.materialize_fixture(self.bundle, fixture))
            for fixture in self.fixtures
            if fixture["fixtureId"].startswith("BE009-SYN-")
        ]
        self.assertEqual([result["status"] for result in synthetic], ["PASS_CONTRACT", "PASS_CONTRACT"])
        self.assertEqual([result["candidateCount"] for result in synthetic], [2, 2])
        self.assertTrue(all(result["datasetExecutionApproved"] is False for result in synthetic))
        self.assertTrue(all(result["be006ProjectionEligible"] is False for result in synthetic))
        self.assertTrue(all(result["publicProjectionCount"] == 0 for result in synthetic))
        self.assertTrue(all(result["sensitiveValueOutputCount"] == 0 for result in synthetic))
        self.assertTrue(all(set(result["candidateStates"]) == {"match_pending"} for result in synthetic))

    def test_unknown_registry_key_fails_closed(self) -> None:
        fixture = next(value for value in self.fixtures if value["fixtureId"] == "BE009-SYN-MOIS-01")
        materialized = gate.materialize_fixture(self.bundle, fixture)
        materialized["registry"]["unexpectedPhysicalField"] = True
        result = gate.evaluate(materialized)
        self.assertEqual(result["status"], "BLOCKED_REGISTRY")
        self.assertEqual(result["errorCodes"], ["BE009_E_FIELD_MAP"])

    def test_unknown_registry_states_fail_closed(self) -> None:
        fixture = next(value for value in self.fixtures if value["fixtureId"] == "BE009-SYN-MOIS-01")
        cases = (
            ("termsStatus", "mystery", "BE009_E_TERMS_PIN"),
            ("format", "YAML", "BE009_E_SCHEMA_PIN"),
            ("endpointStatus", "mystery", "BE009_E_ENDPOINT_UNKNOWN"),
        )
        for key, value, expected_code in cases:
            with self.subTest(key=key):
                materialized = gate.materialize_fixture(self.bundle, fixture)
                materialized["registry"][key] = value
                result = gate.evaluate(materialized)
                self.assertEqual(result["status"], "BLOCKED_REGISTRY")
                self.assertEqual(result["errorCodes"], [expected_code])

    def test_wrong_registry_value_types_fail_closed(self) -> None:
        fixture = next(value for value in self.fixtures if value["fixtureId"] == "BE009-SYN-MOIS-01")
        cases = (
            ("sourceKeyPinned", "false"),
            ("unknownFields", {}),
            ("publicProjectionFields", "published"),
        )
        for key, value in cases:
            with self.subTest(key=key):
                materialized = gate.materialize_fixture(self.bundle, fixture)
                materialized["registry"][key] = value
                result = gate.evaluate(materialized)
                self.assertEqual(result["status"], "BLOCKED_REGISTRY")
                self.assertIn("BE009_E_FIELD_MAP", result["errorCodes"])

    def test_record_artifact_identity_and_registry_adversarial_mutations(self) -> None:
        fixture = next(value for value in self.fixtures if value["fixtureId"] == "BE009-SYN-MOIS-01")

        record_cases = (
            ("phone", "010-1234-5678", "BE009_E_FORBIDDEN_FIELD"),
            ("email", "person@example.test", "BE009_E_FORBIDDEN_FIELD"),
            ("businessNumber", "123-45-67890", "BE009_E_FORBIDDEN_FIELD"),
            ("published", True, "BE009_E_PUBLIC_PROJECTION"),
            ("verified", True, "BE009_E_PUBLIC_PROJECTION"),
            ("inquiryEnabled", True, "BE009_E_PUBLIC_PROJECTION"),
            ("eventFit", True, "BE009_E_EVENT_FIT_INFERENCE"),
            ("price", 1000, "BE009_E_EVENT_FIT_INFERENCE"),
            ("rating", 5, "BE009_E_EVENT_FIT_INFERENCE"),
            ("review", "synthetic review", "BE009_E_EVENT_FIT_INFERENCE"),
        )
        for key, value, expected_code in record_cases:
            with self.subTest(record_field=key):
                materialized = gate.materialize_fixture(self.bundle, fixture)
                materialized["inputRecords"][0][key] = value
                result = gate.evaluate(materialized)
                self.assertEqual(result["status"], "BLOCKED_REGISTRY")
                self.assertIn(expected_code, result["errorCodes"])

        materialized = gate.materialize_fixture(self.bundle, fixture)
        materialized["inputRecords"][1]["sourceRecordKey"] = materialized["inputRecords"][0]["sourceRecordKey"]
        self.assertIn("BE009_E_SOURCE_KEY", gate.evaluate(materialized)["errorCodes"])

        materialized = gate.materialize_fixture(self.bundle, fixture)
        materialized["inputRecords"] = ["not-an-object"]
        self.assertIn("BE009_E_FIELD_MAP", gate.evaluate(materialized)["errorCodes"])

        for portal_id in ("15155669", "HOLD", ""):
            with self.subTest(portal_id=portal_id):
                materialized = gate.materialize_fixture(self.bundle, fixture)
                materialized["registry"]["portalDataId"] = portal_id
                self.assertIn("BE009_E_SOURCE_EXCLUDED", gate.evaluate(materialized)["errorCodes"])

        materialized = gate.materialize_fixture(self.bundle, fixture)
        materialized["registry"]["sourceFamilyId"] = ""
        self.assertIn("BE009_E_SOURCE_EXCLUDED", gate.evaluate(materialized)["errorCodes"])

        materialized = gate.materialize_fixture(self.bundle, fixture)
        materialized["termsArtifact"]["bytes"] = "TAMPERED"
        self.assertIn("BE009_E_TERMS_PIN", gate.evaluate(materialized)["errorCodes"])

        materialized = gate.materialize_fixture(self.bundle, fixture)
        materialized["sourceSchemaArtifact"]["sha256"] = "0" * 64
        self.assertIn("BE009_E_SCHEMA_PIN", gate.evaluate(materialized)["errorCodes"])

        materialized = gate.materialize_fixture(self.bundle, fixture)
        materialized["sourceSchemaArtifact"]["fields"] = [
            "sourceRecordKey",
            "businessName",
            "roadAddress",
            "representativeName",
        ]
        materialized["registry"]["allowedPhysicalFields"].append("representativeName")
        materialized["registry"]["forbiddenPhysicalFields"].remove("representativeName")
        materialized["inputRecords"][0]["representativeName"] = "SYNTHETIC NAME"
        bypass_result = gate.evaluate(materialized)
        self.assertEqual(bypass_result["status"], "BLOCKED_REGISTRY")
        self.assertIn("BE009_E_SCHEMA_PIN", bypass_result["errorCodes"])
        self.assertIn("BE009_E_FORBIDDEN_FIELD", bypass_result["errorCodes"])

        materialized = gate.materialize_fixture(self.bundle, fixture)
        materialized["registry"]["sourceFamilyId"] = 123
        self.assertIn("BE009_E_SOURCE_EXCLUDED", gate.evaluate(materialized)["errorCodes"])

        materialized = gate.materialize_fixture(self.bundle, fixture)
        materialized["inputRecords"][0]["sourceRecordKey"] = ["not", "scalar"]
        source_key_result = gate.evaluate(materialized)
        self.assertEqual(source_key_result["status"], "BLOCKED_REGISTRY")
        self.assertIn("BE009_E_SOURCE_KEY", source_key_result["errorCodes"])

        result = gate.evaluate({"inputRecords": []})
        self.assertEqual(result["status"], "BLOCKED_REGISTRY")
        self.assertIn("BE009_E_FIELD_MAP", result["errorCodes"])

    def test_error_order_and_result_are_deterministic(self) -> None:
        fixture = next(value for value in self.fixtures if value["fixtureId"] == "BE009-CUR-11")
        first = gate.evaluate(gate.materialize_fixture(self.bundle, fixture))
        second = gate.evaluate(gate.materialize_fixture(self.bundle, copy.deepcopy(fixture)))
        self.assertEqual(first, second)
        self.assertEqual(first["errorCodes"], self.bundle["errorAliases"]["PENDING_XML"])

    def test_fixture_bundle_contains_no_real_provider_payload_fields(self) -> None:
        source = json.dumps(self.bundle, ensure_ascii=False).lower()
        for forbidden in ("realprovidername", "realaddress", "realphone", "realbusinessnumber"):
            self.assertNotIn(forbidden, source)

    def test_gate_has_no_network_database_or_secret_dependency(self) -> None:
        source = Path(gate.__file__).read_text(encoding="utf-8")
        for forbidden in ("requests", "urllib", "socket", "sqlite3", "supabase", "dotenv", "os.environ"):
            self.assertNotIn(forbidden, source)


if __name__ == "__main__":
    unittest.main(verbosity=2)
