import { User, Shield, Mail, Building, Loader2, Edit2, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Profile() {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        email: ''
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/users/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCurrentUser(res.data);
            setFormData({
                full_name: res.data.full_name || '',
                username: res.data.username || '',
                email: res.data.email || ''
            });
        } catch (error) {
            console.error("Failed to fetch profile:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/users/${currentUser.id}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage({ type: 'success', text: 'Profil berhasil diperbarui' });
            setIsEditing(false);

            // If username changed, we should probably re-login as the token might become invalid
            if (formData.username !== currentUser.username) {
                setMessage({ type: 'success', text: 'Username changed. Redirecting to login...' });
                setTimeout(() => {
                    localStorage.clear();
                    navigate('/login');
                }, 2000);
            } else {
                fetchProfile();
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.detail || 'Gagal memperbarui profil'
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const role = currentUser?.role;
    const displayName = currentUser?.full_name || currentUser?.username || 'User';
    const roleLabel = role === 'atasan' ? 'Atasan' : (role === 'super_admin' ? 'Super Admin' : 'Admin');

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Profil Pengguna</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Kelola informasi akun Anda
                    </p>
                </div>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                    >
                        <Edit2 className="w-4 h-4" />
                        Edit Profil
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setFormData({
                                    full_name: currentUser.full_name || '',
                                    username: currentUser.username || '',
                                    email: currentUser.email || ''
                                });
                                setMessage(null);
                            }}
                            className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer text-sm font-medium"
                        >
                            <X className="w-4 h-4" />
                            Batal
                        </button>
                    </div>
                )}
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all duration-300">
                <div className="p-8 border-b border-border bg-muted/20">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-4xl font-bold shadow-inner">
                            {displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="text-center md:text-left space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        className="bg-background border border-border rounded px-2 py-1 text-xl font-bold w-full max-w-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="Nama Lengkap"
                                    />
                                ) : (
                                    displayName
                                )}
                            </h2>
                            <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                                    <Shield className="w-3.5 h-3.5" />
                                    {roleLabel}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                                    Member since {new Date(currentUser?.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSave} className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Identitas Akun
                            </h3>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Username</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    disabled={!isEditing || saving}
                                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                />
                                {isEditing && <p className="text-[10px] text-muted-foreground italic">Catatan: Mengubah username akan membuat Anda keluar secara otomatis.</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        disabled={!isEditing || saving}
                                        className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                        placeholder="admin@poldantb.polri.go.id"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Keamanan
                            </h3>

                            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/20">
                                <p className="text-xs text-yellow-800 dark:text-yellow-500 leading-relaxed">
                                    Untuk menjaga keamanan akun, perubahan kata sandi hanya dapat dilakukan melalui menu manajemen pengguna atau dengan menghubungi administrator sistem.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Peran Akses</label>
                                <input
                                    type="text"
                                    value={roleLabel}
                                    disabled
                                    className="w-full px-4 py-2.5 bg-muted/20 border border-border rounded-lg text-sm opacity-60 cursor-not-allowed italic"
                                />
                            </div>
                        </div>
                    </div>

                    {isEditing && (
                        <div className="pt-6 border-t border-border flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                                disabled={saving}
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-8 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Simpan Perubahan
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
