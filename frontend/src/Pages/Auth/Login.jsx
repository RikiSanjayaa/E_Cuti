import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Loader2, Shield, Sun, Moon } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Theme state: 'light' or 'dark' (no 'system')
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') return saved;
      // Default to system preference if no saved preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const navigate = useNavigate();

  // Apply theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post('/api/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token, role } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('role', role);

      if (role === 'super_admin' || role === 'admin') {
        navigate('/admin');
      } else if (role === 'atasan') {
        navigate('/atasan');
      } else {
        setError('Peran tidak diketahui');
      }
    } catch (err) {
      console.error(err);
      setError('Username atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Theme Switcher */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-2 bg-background/80 backdrop-blur-md p-2 rounded-full border shadow-lg">
        <button
          onClick={() => setTheme('light')}
          className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
          title="Light Mode"
        >
          <Sun className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
          title="Dark Mode"
        >
          <Moon className="w-4 h-4" />
        </button>
      </div>

      <div className="min-h-screen flex bg-background">
        {/* Left Side: Brand/Image */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554593451-b8830089859c?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent"></div>

          <div className="relative z-10 p-12 flex flex-col justify-between h-full text-white">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-400" />
              <span className="text-lg font-bold tracking-wide">POLDA NTB</span>
            </div>
            <div>
              <h1 className="text-4xl font-extrabold leading-tight mb-4">
                Sistem Manajemen<br />Cuti & Izin Personel
              </h1>
              <p className="text-zinc-300 text-lg max-w-md">
                Platform terintegrasi untuk efisiensi administrasi dan monitoring kedisiplinan personel.
              </p>
            </div>
            <div className="text-sm text-zinc-500">
              v1.0.0 • Stable Release
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
              <div className="lg:hidden flex justify-center mb-6">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Selamat Datang Kembali</h2>
              <p className="text-muted-foreground mt-2">Silakan masukkan kredensial Anda untuk melanjutkan.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Masukkan username"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <a href="#" className="text-xs text-primary hover:underline font-medium">Lupa password?</a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-2">
                  <div className="w-1 h-4 bg-destructive rounded-full"></div>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full shadow-lg shadow-primary/20"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Masuk ke Sistem'
                )}
              </button>
            </form>

            <div className="text-center lg:text-left text-xs text-muted-foreground mt-4">
              Tidak bisa login? Hubungi administrator Bagian BEKUM.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}