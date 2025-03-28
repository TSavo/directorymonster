import * as layoutComponents from '@/components/admin/layout';

describe('Admin Layout Components Exports', () => {
  it('exports all layout components correctly', () => {
    // Check for all expected exports
    expect(layoutComponents.AdminLayout).toBeDefined();
    expect(layoutComponents.AdminSidebar).toBeDefined();
    expect(layoutComponents.AdminHeader).toBeDefined();
    expect(layoutComponents.Breadcrumbs).toBeDefined();
    expect(layoutComponents.WithAuth).toBeDefined();
    
    // Check icon exports
    expect(layoutComponents.HomeIcon).toBeDefined();
    expect(layoutComponents.ListIcon).toBeDefined();
    expect(layoutComponents.FolderIcon).toBeDefined();
    expect(layoutComponents.GlobeIcon).toBeDefined();
    expect(layoutComponents.UsersIcon).toBeDefined();
    expect(layoutComponents.SettingsIcon).toBeDefined();
    expect(layoutComponents.ChartIcon).toBeDefined();
    expect(layoutComponents.CloseIcon).toBeDefined();
    expect(layoutComponents.MenuIcon).toBeDefined();
    expect(layoutComponents.BellIcon).toBeDefined();
    expect(layoutComponents.UserIcon).toBeDefined();
    expect(layoutComponents.ChevronRightIcon).toBeDefined();
  });
});