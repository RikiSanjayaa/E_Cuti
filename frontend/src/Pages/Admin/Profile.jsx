import { User, Shield, Mail, Building } from 'lucide-react';

export default function Profile() {
    const role = localStorage.getItem('role');
    const isAtasan = role === 'atasan';

    const user = {
        name: isAtasan ? 'Atasan Logistik' : 'Super Administrator',
        username: role || 'user',
        role: isAtasan ? 'Atasan' : (role === 'super_admin' ? 'Super Admin' : 'Admin'),
        email: isAtasan ? 'atasan@poldantb.polri.go.id' : 'admin@poldantb.polri.go.id',
        division: 'Biro Logistik'
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Profil Pengguna</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Informasi akun dan detail pengguna
                </p>
            </div>

            <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-semibold">
                            {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Shield className="w-3 h-3" /> {user.role}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-foreground border-b border-border pb-2">Detail Akun</h3>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Username</label>
                            <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-md border border-border">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{user.username}</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Email</label>
                            <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-md border border-border">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{user.email}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-foreground border-b border-border pb-2">Informasi Organisasi</h3>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Satuan Kerja</label>
                            <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-md border border-border">
                                <Building className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{user.division}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
