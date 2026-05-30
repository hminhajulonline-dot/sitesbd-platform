-- ============================================
-- Seed Role Permissions
-- ============================================

-- System Owner: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.role_type = 'system_owner';

-- Super Admin: All permissions except system_owner-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.role_type = 'super_admin';

-- Admin: Most management permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.role_type = 'admin' 
AND p.action IN ('read', 'create', 'update')
AND p.resource NOT IN ('audit_logs');

-- Billing Manager: Billing permissions only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.role_type = 'billing_manager'
AND p.resource IN ('invoices', 'payments');

-- Support Agent: Support and view permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.role_type = 'support_agent'
AND (p.resource IN ('tickets', 'users') OR p.name LIKE '%view_%');

-- User: Limited self-service permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.role_type = 'user'
AND p.resource IN ('domains', 'dns_records', 'tickets')
AND p.action IN ('read', 'create', 'update');
