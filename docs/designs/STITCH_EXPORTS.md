# FixFlow — Google Stitch screen exports

**Source project:** https://stitch.google.com/projects/2412544707647263879

The supplied Google Stitch ZIP contains **23 screen exports**. Each screen has a generated `code.html` file and a `screen.png` preview. The export also includes `operations_engine/DESIGN.md`, which defines the visual system, color tokens, typography, spacing, components and human-in-the-loop AI presentation.

## Screen inventory

| Export folder | Screen area |
|---|---|
| `fixflow_manager_operations_command_center_desktop` | Manager operations command center |
| `fixflow_manager_operations_command_center_1440px_desktop` | Manager command center, 1440px desktop |
| `manager_operations_dashboard` | Manager operations dashboard |
| `fixflow_manager_operations_dashboard` | Manager operations dashboard variant |
| `maintenance_request_inbox` | Maintenance request inbox |
| `maintenance_workspace_scout_ai_1` | Maintenance workspace with Scout AI |
| `maintenance_workspace_scout_ai_2` | Maintenance workspace with Scout AI variant |
| `flow_ai_operations_panel_1` | Flow AI operations panel |
| `flow_ai_operations_panel_2` | Flow AI operations panel variant |
| `tenant_home_fixflow_resident_portal` | Tenant home |
| `tenant_portal_report_issue` | Tenant portal report issue |
| `report_a_problem_fixflow_resident_portal` | Report a problem form |
| `my_maintenance_requests_fixflow_resident_portal` | Tenant maintenance request list |
| `request_tracking_detail_fixflow_resident_portal` | Tenant request tracking detail |
| `completion_verification_dispute_fixflow_resident_portal_1` | Completion verification and dispute |
| `completion_verification_dispute_fixflow_resident_portal_2` | Completion verification variant |
| `completion_verification_dispute_fixflow_resident_portal_3` | Completion verification refined variant |
| `system_states_confirmations_fixflow_resident_portal` | Tenant system states and confirmations |
| `fixflow_properties_portfolio_directory_desktop` | Properties portfolio directory |
| `fixflow_property_details_oakridge_crest_highrise_desktop` | Property details |
| `fixflow_properties_units_form_operations_desktop` | Property and unit form operations |
| `fixflow_unit_management_directory_desktop` | Unit management directory |
| `fixflow_tenant_association_access_security_desktop` | Tenant association and access security |

## Design-system source

The original export's `operations_engine/DESIGN.md` is the authoritative source for the exported Stitch design tokens. It specifies:
- Pine teal primary color (`#005c55` / `#0f766e` component usage)
- Precision blue for active processes
- Safety rose for critical risks
- Space Grotesk headings and Geist body typography
- Desktop 12-column, tablet 6-column and mobile 4-column layout guidance
- Explicit human approval controls for Scout and Flow AI recommendations

## Implementation guidance

These exports are design references and generated HTML, not the production React application. Rebuild the approved screens as maintainable React components. Connect real data, authentication, permissions and API behaviour through the application architecture; do not treat static sample data or generated HTML as production functionality. Review exported HTML before selectively reusing any markup or styles.
