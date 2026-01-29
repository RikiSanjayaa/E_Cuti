import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Bell, Globe } from 'lucide-react';

export default function Preferences() {
    // Theme State
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        // Apply theme on mount and change
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Preferensi</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Atur tampilan dan preferensi aplikasi
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tampilan / Theme */}
                <div className="bg-card border border-border rounded-lg shadow-sm">
                    <div className="p-4 border-b border-border">
                        <h2 className="font-semibold text-foreground flex items-center gap-2">
                            <Monitor className="w-4 h-4" />
                            Tampilan
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-foreground font-medium">Mode Tema</p>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => handleThemeChange('light')}
                                className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${theme === 'light'
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                    : 'border-border hover:bg-muted/50'
                                    }`}
                            >
                                <Sun className={`w-6 h-6 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className="text-sm font-medium">Terang</span>
                            </button>

                            <button
                                onClick={() => handleThemeChange('dark')}
                                className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${theme === 'dark'
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                    : 'border-border hover:bg-muted/50'
                                    }`}
                            >
                                <Moon className={`w-6 h-6 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className="text-sm font-medium">Gelap</span>
                            </button>

                            {/* System currently treated as light default for simplicity, ideally would check media query */}
                            <button
                                disabled
                                className="p-4 rounded-lg border border-border flex flex-col items-center gap-2 opacity-50 cursor-not-allowed"
                            >
                                <Monitor className="w-6 h-6 text-muted-foreground" />
                                <span className="text-sm font-medium">Sistem</span>
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Pilih tema tampilan aplikasi yang nyaman untuk mata Anda.
                        </p>
                    </div>
                </div>

                {/* Notifikasi (Placeholder) */}
                <div className="bg-card border border-border rounded-lg shadow-sm opacity-60">
                    <div className="p-4 border-b border-border">
                        <h2 className="font-semibold text-foreground flex items-center gap-2">
                            <Bell className="w-4 h-4" />
                            Notifikasi
                        </h2>
                    </div>
                    <div className="p-6 text-center text-sm text-muted-foreground">
                        Pengaturan notifikasi akan tersedia segera.
                    </div>
                </div>
            </div>
        </div>
    );
}
