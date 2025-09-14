export interface SidebarConfig {
  id: string;
  name: string;
  url: string;
  icon: string;
  roles?: Array<'superuser' | 'admin'>;
}
