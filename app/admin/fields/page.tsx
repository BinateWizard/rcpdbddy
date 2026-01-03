'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Smartphone, 
  Sprout, 
  ArrowLeft,
  Search,
  Calendar,
  LayoutDashboard,
  Settings,
  Shield,
  TrendingUp,
  FileText,
  LogOut,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ADMIN_EMAILS = [
  'ricepaddy.contact@gmail.com',
];

interface FieldData {
  id: string;
  fieldName: string;
  riceVariety: string;
  startDay: string;
  status?: string;
  userName: string;
  userEmail: string;
  devicesCount: number;
}

export default function AdminFields() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<FieldData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  useEffect(() => {
    if (user) {
      const isUserAdmin = ADMIN_EMAILS.includes(user.email || '');
      setIsAdmin(isUserAdmin);
      
      if (isUserAdmin) {
        fetchFields();
      }
    }
    setLoading(false);
  }, [user]);

  const fetchFields = async () => {
    setIsRefreshing(true);
    setSuccessMessage('');
    setShowSuccess(false);
    try {
      const fieldsData: FieldData[] = [];
      
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        const fieldsRef = collection(db, 'users', userDoc.id, 'fields');
        const fieldsSnapshot = await getDocs(fieldsRef);

        for (const fieldDoc of fieldsSnapshot.docs) {
          const fieldData = fieldDoc.data();
          
          // Count devices
          const paddiesRef = collection(db, 'users', userDoc.id, 'fields', fieldDoc.id, 'paddies');
          const paddiesSnapshot = await getDocs(paddiesRef);

          fieldsData.push({
            id: fieldDoc.id,
            fieldName: fieldData.fieldName,
            riceVariety: fieldData.riceVariety,
            startDay: fieldData.startDay,
            status: fieldData.status || 'active',
            userName: userData.displayName || userData.email?.split('@')[0] || 'Unknown',
            userEmail: userData.email || '',
            devicesCount: paddiesSnapshot.size
          });
        }
      }

      setFields(fieldsData);
      setSuccessMessage(`✓ Successfully loaded ${fieldsData.length} field(s)`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error fetching fields:', error);
      setSuccessMessage('✗ Error: Failed to load fields. Please check your connection and try again.');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredFields = fields.filter(f => {
    const searchLower = searchQuery.toLowerCase();
    return (f.fieldName || '').toLowerCase().includes(searchLower) ||
      (f.riceVariety || '').toLowerCase().includes(searchLower) ||
      (f.userName || '').toLowerCase().includes(searchLower);
  });

  const activeFields = fields.filter(f => f.status === 'active').length;
  const harvestedFields = fields.filter(f => f.status === 'harvested').length;

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Smartphone, label: 'Devices', path: '/admin/devices' },
    { icon: Sprout, label: 'Fields', path: '/admin/fields' },
    { icon: FileText, label: 'Content', path: '/admin/content' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardContent className="p-6 sm:p-8 text-center">
            <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Access Denied</h2>
            <Button 
              onClick={() => router.push('/')}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20 lg:pb-0">
      {/* Admin Navbar */}
      <nav className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <Image src="/icons/rice_logo.png" alt="PadBuddy" width={32} height={32} className="rounded-lg sm:w-9 sm:h-9" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">PadBuddy</h1>
                <p className="text-[10px] sm:text-xs text-green-500 font-medium">Admin Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-slate-400 hidden sm:block truncate max-w-[150px]">{user.email}</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/')}
                className="text-slate-400 hover:text-white hover:bg-slate-700 text-xs sm:text-sm px-2 sm:px-3"
              >
                Exit
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-4rem)] bg-slate-800/50 border-r border-slate-700 p-4 hidden lg:flex lg:flex-col">
          <nav className="space-y-2 flex-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className={`w-full justify-start ${
                  pathname === item.path
                    ? 'text-white bg-green-600/20 hover:bg-green-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                onClick={() => router.push(item.path)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            ))}
          </nav>
          
          {/* Sign Out Button */}
          <div className="pt-4 border-t border-slate-700">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={() => setIsLogoutModalOpen(true)}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-6">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/admin')}
              className="text-slate-400 hover:text-white hover:bg-slate-700 h-8 w-8 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white">Fields Management</h1>
              <p className="text-xs sm:text-sm text-slate-400">View all rice fields across the platform</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Sprout className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg sm:text-2xl font-bold text-white">{fields.length}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 truncate">Total Fields</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg sm:text-2xl font-bold text-white">{activeFields}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 truncate">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-base sm:text-xl">🌾</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg sm:text-2xl font-bold text-white">{harvestedFields}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 truncate">Harvested</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Success/Error Banner - HCI Rule 3 & 4 */}
          {showSuccess && (
            <div className={`mb-4 p-3 rounded-lg border-2 flex items-center justify-between animate-fade-in ${
              successMessage.startsWith('✓') 
                ? 'bg-green-100 border-green-500' 
                : 'bg-red-100 border-red-500'
            }`}>
              <span className={`font-semibold text-sm ${
                successMessage.startsWith('✓') ? 'text-green-800' : 'text-red-800'
              }`}>
                {successMessage}
              </span>
              <button
                onClick={() => setShowSuccess(false)}
                className="text-sm px-2 py-1 hover:bg-white/50 rounded transition-colors"
                title="Dismiss message"
              >
                ✕
              </button>
            </div>
          )}

          {/* Search */}
          <div className="relative mb-4 sm:mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search fields by name, variety, or owner... (HCI Rule 8: Clear context)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-20 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              title="Type to search across all field properties"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                title="Clear search (HCI Rule 2: Quick action)"
              >
                Clear
              </button>
            )}
          </div>

          {/* Fields List */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-white text-sm sm:text-base">All Fields ({filteredFields.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              {filteredFields.length === 0 ? (
                <p className="text-slate-500 text-center py-8 text-sm">No fields found</p>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {filteredFields.map((field) => (
                    <div 
                      key={field.id}
                      className="flex items-center justify-between p-3 sm:p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                        <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          field.status === 'harvested' 
                            ? 'bg-yellow-500/20' 
                            : field.status === 'concluded'
                            ? 'bg-gray-500/20'
                            : 'bg-green-500/20'
                        }`}>
                          {field.status === 'harvested' ? (
                            <span className="text-xl sm:text-2xl">🌾</span>
                          ) : (
                            <Sprout className={`h-5 w-5 sm:h-6 sm:w-6 ${
                              field.status === 'concluded' ? 'text-gray-500' : 'text-green-500'
                            }`} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white text-sm sm:text-base truncate">{field.fieldName}</p>
                          <p className="text-xs sm:text-sm text-slate-400 truncate">{field.riceVariety}</p>
                          <p className="text-[10px] sm:text-xs text-slate-500 truncate">Owner: {field.userName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <div className="text-center hidden sm:block">
                          <p className="text-base sm:text-lg font-bold text-white">{field.devicesCount}</p>
                          <p className="text-[10px] sm:text-xs text-slate-400">Devices</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                            field.status === 'harvested' 
                              ? 'bg-yellow-500/20 text-yellow-500' 
                              : field.status === 'concluded'
                              ? 'bg-gray-500/20 text-gray-400'
                              : 'bg-green-500/20 text-green-500'
                          }`}>
                            {field.status === 'harvested' ? '🌾 Harvested' : 
                             field.status === 'concluded' ? 'Concluded' : 'Active'}
                          </span>
                          <p className="text-[10px] sm:text-xs text-slate-500 mt-1 flex items-center justify-end gap-1">
                            <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            {new Date(field.startDay).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-800 border-t border-slate-700 lg:hidden">
        <nav className="flex justify-around h-16">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center flex-1 py-2 relative transition-all duration-200 ${
                pathname === item.path ? 'text-green-500' : 'text-slate-400'
              }`}
            >
              {pathname === item.path && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-green-500 rounded-b-full" />
              )}
              <item.icon className={`h-5 w-5 transition-transform duration-200 ${
                pathname === item.path ? 'scale-110' : ''
              }`} />
              <span className={`text-[10px] mt-1 transition-all duration-200 ${
                pathname === item.path ? 'font-semibold' : ''
              }`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Logout Confirmation Modal - Dark Theme */}
      <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <LogOut className="h-6 w-6 text-red-500" />
            </div>
            <DialogTitle className="text-center text-xl text-white">Sign Out</DialogTitle>
            <DialogDescription className="text-center text-slate-400">
              Are you sure you want to sign out from the admin panel?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsLogoutModalOpen(false)}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogout}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
