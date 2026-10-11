# Potential Risk: Recipient Account-Number Validation

**Reference ID:** VB-OBS-001  
**Category:** Input Validation / Financial Integrity  
**Status:** Under Investigation  
**Classification:** Potential Risk, Not a Confirmed Defect

## Observation

The recipient account-number field does not visibly define format restrictions such as a minimum length, maximum length, or permitted character pattern in the UI.

The project does not currently specify the expected recipient account-number format. Additionally, existing database records contain account identifiers of different lengths. Therefore, a fixed-length or digits-only requirement cannot be assumed.

## Evidence

- The recipient account-number field has no visible `maxlength`, `minlength`, or `pattern` restriction in the inspected UI.
- Existing account identifiers in the database have different lengths.
- No documented project requirement has been identified that defines the permitted account-number format.

## Potential Risk

If recipient account numbers are not validated appropriately, malformed or unsupported values may be submitted to the transfer endpoint. Depending on the server-side validation and transaction logic, this could result in confusing error messages, unsuccessful transfer attempts, or financial-record inconsistencies.

These outcomes are potential risks and have not all been established by this observation.

## Expected Behaviour to Clarify

The project owner or requirements documentation should clarify:

- Which characters are permitted in a recipient account number.
- Whether account-number length varies by account type or identifier.
- Whether validation should occur in the UI, on the server, or both.
- How invalid or unsupported recipient identifiers should be handled.

## Recommended Next Steps

1. Review the application requirements or consult the project owner for the expected account-number format.
2. Inspect server-side validation to determine whether format and recipient-existence checks are performed.
3. Test representative inputs against the clarified requirements.
4. Raise a formal defect only if observed behaviour violates a defined requirement or demonstrates a confirmed business or security issue.

## Conclusion

This observation identifies a potential input-validation risk. It is not classified as a confirmed defect because the required account-number format has not been established.

The application under test has not been modified.