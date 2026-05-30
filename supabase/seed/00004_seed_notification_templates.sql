-- ============================================
-- Seed Notification Templates
-- ============================================

INSERT INTO notification_templates (name, channel, subject, content, status) VALUES
-- Email templates
('Welcome Email', 'email', 'Welcome to SitesBD!', 'Dear {{user_name}}, welcome to SitesBD! Your account has been created successfully.', 'active'),
('Domain Registered', 'email', 'Domain {{domain_name}} Registered', 'Your domain {{domain_name}} has been successfully registered.', 'active'),
('DNS Updated', 'email', 'DNS Records Updated for {{domain_name}}', 'Your DNS records for {{domain_name}} have been updated.', 'active'),
('Invoice Generated', 'email', 'Invoice #{{invoice_number}}', 'Your invoice #{{invoice_number}} for {{amount}} is now available.', 'active'),
('Payment Received', 'email', 'Payment Confirmed', 'We have received your payment of {{amount}}. Thank you!', 'active'),

-- In-app templates
('Welcome Notification', 'in_app', 'Welcome to SitesBD!', 'Welcome to SitesBD! Start by adding your first domain.', 'active'),
('New Announcement', 'in_app', 'New Announcement', '{{announcement_title}}: {{announcement_excerpt}}', 'active'),
('Ticket Updated', 'in_app', 'Support Ticket Update', 'Your ticket #{{ticket_number}} has been updated.', 'active'),
('Domain Expiring', 'in_app', 'Domain Expiring Soon', 'Your domain {{domain_name}} will expire on {{expiration_date}}.', 'active'),

-- WhatsApp templates
('SMS Alert', 'whatsapp', NULL, 'SitesBD: {{message}}', 'active'),
('Payment Reminder', 'whatsapp', NULL, 'SitesBD: Please complete your payment for invoice #{{invoice_number}}.', 'active');
