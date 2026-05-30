-- ============================================
-- Seed Roles
-- ============================================

-- Insert system roles
INSERT INTO roles (name, description, role_type, is_system) VALUES
('System Owner', 'Full system access with all privileges', 'system_owner', TRUE),
('Super Admin', 'Administrative access to all resources', 'super_admin', TRUE),
('Admin', 'Administrative access to manage users and domains', 'admin', TRUE),
('Billing Manager', 'Access to billing and payment management', 'billing_manager', TRUE),
('Support Agent', 'Access to support tickets and user assistance', 'support_agent', TRUE),
('User', 'Standard user with limited access', 'user', TRUE);

-- Insert permissions
INSERT INTO permissions (name, description, resource, action) VALUES
-- User management
('view_users', 'View all users', 'users', 'read'),
('create_users', 'Create new users', 'users', 'create'),
('update_users', 'Update user information', 'users', 'update'),
('delete_users', 'Delete users', 'users', 'delete'),
('suspend_users', 'Suspend user accounts', 'users', 'suspend'),

-- Domain management
('view_domains', 'View all domains', 'domains', 'read'),
('create_domains', 'Create new domains', 'domains', 'create'),
('update_domains', 'Update domain information', 'domains', 'update'),
('delete_domains', 'Delete domains', 'domains', 'delete'),
('transfer_domains', 'Transfer domains', 'domains', 'transfer'),

-- DNS management
('view_dns_records', 'View DNS records', 'dns_records', 'read'),
('create_dns_records', 'Create DNS records', 'dns_records', 'create'),
('update_dns_records', 'Update DNS records', 'dns_records', 'update'),
('delete_dns_records', 'Delete DNS records', 'dns_records', 'delete'),

-- Billing
('view_invoices', 'View invoices', 'invoices', 'read'),
('create_invoices', 'Create invoices', 'invoices', 'create'),
('update_invoices', 'Update invoices', 'invoices', 'update'),
('delete_invoices', 'Delete invoices', 'invoices', 'delete'),
('process_payments', 'Process payments', 'payments', 'process'),
('refund_payments', 'Refund payments', 'payments', 'refund'),

-- Support
('view_tickets', 'View support tickets', 'tickets', 'read'),
('create_tickets', 'Create support tickets', 'tickets', 'create'),
('update_tickets', 'Update support tickets', 'tickets', 'update'),
('delete_tickets', 'Delete support tickets', 'tickets', 'delete'),
('assign_tickets', 'Assign tickets to agents', 'tickets', 'assign'),

-- CMS
('view_cms_pages', 'View CMS pages', 'cms_pages', 'read'),
('create_cms_pages', 'Create CMS pages', 'cms_pages', 'create'),
('update_cms_pages', 'Update CMS pages', 'cms_pages', 'update'),
('delete_cms_pages', 'Delete CMS pages', 'cms_pages', 'delete'),
('publish_cms_pages', 'Publish CMS pages', 'cms_pages', 'publish'),

-- Settings
('view_settings', 'View system settings', 'settings', 'read'),
('update_settings', 'Update system settings', 'settings', 'update'),
('manage_feature_flags', 'Manage feature flags', 'feature_flags', 'manage'),

-- Cloudflare
('view_cloudflare_zones', 'View Cloudflare zones', 'cloudflare_zones', 'read'),
('create_cloudflare_zones', 'Create Cloudflare zones', 'cloudflare_zones', 'create'),
('update_cloudflare_zones', 'Update Cloudflare zones', 'cloudflare_zones', 'update'),
('delete_cloudflare_zones', 'Delete Cloudflare zones', 'cloudflare_zones', 'delete'),
('sync_dns_records', 'Sync DNS records with Cloudflare', 'cloudflare_zones', 'sync'),

-- Audit
('view_audit_logs', 'View audit logs', 'audit_logs', 'read'),
('export_audit_logs', 'Export audit logs', 'audit_logs', 'export');
