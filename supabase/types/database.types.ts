// ============================================
// SitesBD Platform Database Types
// Generated from Supabase schema
// ============================================

// Enums
export type UserStatus = 'pending' | 'active' | 'suspended';
export type DomainStatus = 'available' | 'reserved' | 'pending' | 'active' | 'suspended' | 'expired' | 'archived';
export type InvoiceStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';
export type TicketStatus = 'open' | 'processing' | 'resolved' | 'closed';
export type RoleType = 'system_owner' | 'super_admin' | 'admin' | 'billing_manager' | 'support_agent' | 'user';
export type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SOA' | 'SRV' | 'CAA' | 'DS' | 'DNSKEY' | 'RRSIG' | 'NAPTR' | 'PTR';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'bank_transfer' | 'bkash' | 'nagad' | 'rocket' | 'other';
export type DnsSyncStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type CommentType = 'note' | 'resolution' | 'internal';
export type NotificationChannel = 'email' | 'whatsapp' | 'in_app';
export type NotificationType = 'info' | 'warning' | 'success' | 'error';
export type AnnouncementType = 'info' | 'maintenance' | 'promotion' | 'warning';
export type PlatformStatus = 'active' | 'inactive' | 'deprecated';
export type GuideStatus = 'draft' | 'published' | 'archived';

// Base types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface BaseEntityNoUpdate {
  id: string;
  created_at: string;
}

// ============================================
// Users
// ============================================

export interface Profile extends BaseEntity {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: UserStatus;
}

// ============================================
// User Sessions, Devices & Preferences
// ============================================

export interface UserSession extends BaseEntityNoUpdate {
  user_id: string;
  session_token: string;
  refresh_token: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_id: string | null;
  expires_at: string;
  last_activity_at: string;
  is_active: boolean;
}

export interface UserDevice extends BaseEntity {
  user_id: string;
  device_id: string;
  device_name: string | null;
  device_type: string;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  first_seen_at: string;
  last_active_at: string;
  is_trusted: boolean;
  is_current: boolean;
}

export interface UserPreferences extends BaseEntity {
  user_id: string;
  theme: string;
  language: string;
  timezone: string;
  notification_email: boolean;
  notification_whatsapp: boolean;
  notification_in_app: boolean;
  notification_marketing: boolean;
}

// ============================================
// Roles & Permissions
// ============================================

export interface Role extends BaseEntity {
  name: string;
  description: string | null;
  role_type: RoleType;
  is_system: boolean;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  expires_at: string | null;
  created_at: string;
}

// ============================================
// Domains
// ============================================

export interface Domain extends BaseEntity {
  user_id: string;
  domain_name: string;
  registrar: string | null;
  registration_date: string | null;
  expiration_date: string | null;
  auto_renew: boolean;
  status: DomainStatus;
  is_primary: boolean;
  cloudflare_zone_id: string | null;
  notes: string | null;
}

export interface DomainReservation extends BaseEntity {
  domain_name: string;
  reserved_by: string;
  expires_at: string;
  status: DomainStatus;
}

export interface DomainClaim extends BaseEntity {
  domain_name: string;
  claimed_by: string;
  claimed_at: string;
  expires_at: string;
  status: DomainStatus;
}

export interface DomainActivityLog {
  id: string;
  domain_id: string;
  user_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ============================================
// DNS
// ============================================

export interface DnsRecord extends BaseEntity {
  domain_id: string;
  record_type: DnsRecordType;
  name: string;
  value: string;
  priority: number | null;
  ttl: number;
  proxied: boolean;
  is_active: boolean;
}

export interface DnsTemplate extends BaseEntity {
  user_id: string | null;
  name: string;
  description: string | null;
  is_public: boolean;
}

export interface DnsTemplateRecord {
  id: string;
  template_id: string;
  record_type: DnsRecordType;
  name: string;
  value: string;
  priority: number | null;
  ttl: number;
  created_at: string;
}

export interface TxtRule extends BaseEntity {
  domain_id: string;
  rule_name: string;
  pattern: string;
  replacement: string | null;
  is_active: boolean;
}

// ============================================
// Billing
// ============================================

export interface Invoice extends BaseEntity {
  invoice_number: string;
  user_id: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Payment extends BaseEntity {
  invoice_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_id: string | null;
  gateway_response: Record<string, unknown> | null;
  paid_at: string | null;
  refunded_at: string | null;
  metadata: Record<string, unknown> | null;
}

// ============================================
// Support
// ============================================

export interface Ticket extends BaseEntity {
  ticket_number: string;
  user_id: string;
  subject: string;
  description: string | null;
  category: string | null;
  priority: string;
  status: TicketStatus;
  assigned_to: string | null;
  domain_id: string | null;
  closed_at: string | null;
}

export interface TicketMessage extends BaseEntity {
  ticket_id: string;
  user_id: string;
  message: string;
  message_type: CommentType;
  is_internal: boolean;
  attachments: unknown | null;
}

// ============================================
// CMS
// ============================================

export interface CmsPage extends BaseEntity {
  slug: string;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  status: string;
  author_id: string;
  published_at: string | null;
}

export interface CmsSection extends BaseEntity {
  page_id: string;
  section_key: string;
  section_type: string;
  order_index: number;
  props: Record<string, unknown>;
}

export interface CmsContent extends BaseEntity {
  section_id: string;
  locale: string;
  content: Record<string, unknown>;
}

// ============================================
// Settings
// ============================================

export interface SystemSetting extends BaseEntity {
  key: string;
  value: string | null;
  value_type: string;
  description: string | null;
  is_public: boolean;
  category: string | null;
}

export interface FeatureFlag extends BaseEntity {
  key: string;
  description: string | null;
  is_enabled: boolean;
  enabled_for_users: string[] | null;
  disabled_for_users: string[] | null;
  rollout_percentage: number;
  metadata: Record<string, unknown> | null;
}

export interface SmtpSetting extends BaseEntity {
  name: string;
  host: string;
  port: number;
  username: string | null;
  encrypted_password: string | null;
  encryption: string;
  from_email: string | null;
  from_name: string | null;
  is_default: boolean;
  is_active: boolean;
}

// ============================================
// Cloudflare
// ============================================

export interface CloudflareZone extends BaseEntity {
  domain_id: string;
  zone_id: string;
  zone_name: string;
  status: string | null;
  plan: string | null;
  name_servers: string[] | null;
  verification_status: string | null;
  activated_at: string | null;
}

export interface DnsSyncJob {
  id: string;
  zone_id: string;
  status: DnsSyncStatus;
  records_synced: number;
  records_failed: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface DnsSnapshot {
  id: string;
  zone_id: string;
  snapshot_data: Record<string, unknown>;
  record_count: number;
  created_at: string;
}

// ============================================
// Security
// ============================================

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  created_at: string;
}

// ============================================
// Quick Connect
// ============================================

export interface QuickConnectPlatform extends BaseEntity {
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  status: PlatformStatus;
  sort_order: number;
}

export interface QuickConnectTemplate extends BaseEntity {
  platform_id: string;
  name: string;
  description: string | null;
  status: PlatformStatus;
}

export interface QuickConnectField {
  id: string;
  platform_id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  required: boolean;
  placeholder: string | null;
  sort_order: number;
  created_at: string;
}

export interface ConnectionGuide extends BaseEntity {
  platform_id: string;
  title: string;
  slug: string;
  content: string;
  status: GuideStatus;
  sort_order: number;
}

// ============================================
// Notifications
// ============================================

export interface NotificationTemplate extends BaseEntity {
  name: string;
  channel: NotificationChannel;
  subject: string | null;
  content: string;
  status: PlatformStatus;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ============================================
// Announcements
// ============================================

export interface Announcement extends BaseEntity {
  title: string;
  content: string;
  type: AnnouncementType;
  status: PlatformStatus;
  start_date: string | null;
  end_date: string | null;
}

// ============================================
// Database Helpers
// ============================================

export type Tables = {
  profiles: Profile;
  user_sessions: UserSession;
  user_devices: UserDevice;
  user_preferences: UserPreferences;
  roles: Role;
  permissions: Permission;
  role_permissions: RolePermission;
  user_roles: UserRole;
  domains: Domain;
  domain_reservations: DomainReservation;
  domain_claims: DomainClaim;
  domain_activity_logs: DomainActivityLog;
  dns_records: DnsRecord;
  dns_templates: DnsTemplate;
  dns_template_records: DnsTemplateRecord;
  txt_rules: TxtRule;
  invoices: Invoice;
  invoice_items: InvoiceItem;
  payments: Payment;
  tickets: Ticket;
  ticket_messages: TicketMessage;
  cms_pages: CmsPage;
  cms_sections: CmsSection;
  cms_content: CmsContent;
  system_settings: SystemSetting;
  feature_flags: FeatureFlag;
  smtp_settings: SmtpSetting;
  cloudflare_zones: CloudflareZone;
  dns_sync_jobs: DnsSyncJob;
  dns_snapshots: DnsSnapshot;
  audit_logs: AuditLog;
  activity_logs: ActivityLog;
  quick_connect_platforms: QuickConnectPlatform;
  quick_connect_templates: QuickConnectTemplate;
  quick_connect_fields: QuickConnectField;
  connection_guides: ConnectionGuide;
  notification_templates: NotificationTemplate;
  notifications: Notification;
  announcements: Announcement;
};
