'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Smartphone, 
  Sprout, 
  ArrowLeft,
  Search,
  MoreVertical,
  Mail,
  Calendar,
  LayoutDashboard,
  Settings,
  Shield,
  FileText,
  LogOut,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ADMIN_EMAILS = [
  'ricepaddy.contact@gmail.com',
];

interface UserData {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: any;
  updatedAt?: any;
  fieldsCount?: number;
  devicesCount?: number;
}

export default function AdminUsers() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
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
        fetchUsers();
      }
    }
    setLoading(false);
  }, [user]);

  const fetchUsers = async () => {
    setIsRefreshing(true);
    setSuccessMessage('');
    setShowSuccess(false);
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const usersData: UserData[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = { id: userDoc.id, ...userDoc.data() } as UserData;
        
        // Count fields
        const fieldsRef = collection(db, 'users', userDoc.id, 'fields');
        const fieldsSnapshot = await getDocs(fieldsRef);
        userData.fieldsCount = fieldsSnapshot.size;

        // Count devices
        let devicesCount = 0;
        for (const fieldDoc of fieldsSnapshot.docs) {
          const paddiesRef = collection(db, 'users', userDoc.id, 'fields', fieldDoc.id, 'paddies');
          const paddiesSnapshot = await getDocs(paddiesRef);
          devicesCount += paddiesSnapshot.size;
        }
        userData.devicesCount = devicesCount;

        usersData.push(userData);
      }

      setUsers(usersData);
      setSuccessMessage(`✓ Successfully loaded ${usersData.length} user(s)`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error fetching users:', error);
      setSuccessMessage('✗ Error: Failed to load users. Please check your connection and try again.');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const searchLower = searchQuery.toLowerCase();
    return (u.email || '').toLowerCase().includes(searchLower) ||
      (u.displayName || '').toLowerCase().includes(searchLower);
  });

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
            <p className="text-slate-400 mb-6 text-sm">You don't have permission to access this page.</p>
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
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/admin')}
                className="text-slate-400 hover:text-white hover:bg-slate-700 h-8 w-8 sm:h-10 sm:w-10"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white">Users Management</h1>
                <p className="text-xs sm:text-sm text-slate-400">View and manage registered farmers</p>
              </div>
            </div>
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
              placeholder="Search users by email or name... (HCI Rule 8: Clear context)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-20 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              title="Type to search across user emails and names"
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

          {/* Users Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg sm:text-2xl font-bold text-white">{users.length}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 truncate">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Sprout className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg sm:text-2xl font-bold text-white">
                      {users.reduce((acc, u) => acc + (u.fieldsCount || 0), 0)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400 truncate">Total Fields</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg sm:text-2xl font-bold text-white">
                      {users.reduce((acc, u) => acc + (u.devicesCount || 0), 0)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400 truncate">Total Devices</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-white text-sm sm:text-base">All Users ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              {filteredUsers.length === 0 ? (
                <p className="text-slate-500 text-center py-8 text-sm">No users found</p>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {filteredUsers.map((userData) => (
                    <div 
                      key={userData.id} 
                      className="p-3 sm:p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      {/* Desktop Layout */}
                      <div className="hidden sm:flex items-center justify-between">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          {userData.photoURL ? (
                            <img 
                              src={userData.photoURL} 
                              alt={userData.displayName || ''} 
                              className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-green-500 font-semibold text-lg">
                                {userData.email?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-white text-base truncate">
                              {userData.displayName || userData.email?.split('@')[0] || 'Unknown'}
                            </p>
                            <p className="text-sm text-slate-400 flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{userData.email}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 flex-shrink-0">
                          <div className="text-center">
                            <p className="text-lg font-bold text-white">{userData.fieldsCount || 0}</p>
                            <p className="text-xs text-slate-400">Fields</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-white">{userData.devicesCount || 0}</p>
                            <p className="text-xs text-slate-400">Devices</p>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Layout - Stacked */}
                      <div className="sm:hidden">
                        <div className="flex items-center gap-3 mb-3">
                          {userData.photoURL ? (
                            <img 
                              src={userData.photoURL} 
                              alt={userData.displayName || ''} 
                              className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-green-500 font-semibold text-sm">
                                {userData.email?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-white text-sm truncate">
                              {userData.displayName || userData.email?.split('@')[0] || 'Unknown'}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {userData.email}
                            </p>
                          </div>
                        </div>
                        {/* Stats row */}
                        <div className="flex gap-4 pt-2 border-t border-slate-600/50">
                          <div className="flex items-center gap-2">
                            <Sprout className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-xs text-slate-300">
                              <span className="font-semibold text-white">{userData.fieldsCount || 0}</span> Fields
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-3.5 w-3.5 text-purple-500" />
                            <span className="text-xs text-slate-300">
                              <span className="font-semibold text-white">{userData.devicesCount || 0}</span> Devices
                            </span>
                          </div>
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
