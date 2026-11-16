import React, { FormEvent } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Lock,
    User,
    ArrowRight,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';

interface Props {
    store?: {
        store_name: string;
        tagline: string;
    } | null;
}

export default function Login({ store }: Props) {
    const { flash } = usePage().props as any;

    const { data, setData, post, processing, errors, reset } = useForm({
        login: '',
        password: '',
        remember: true,
        phone_extra: '', // Honeypot field (wajib kosong)
    });

    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Batasi karakter: hanya izinkan alfanumerik, @, dan . (titik)
        // Simbol JavaScript (<, >, script, quote, semicolon, dll.) dan simbol lain langsung difilter
        const filtered = e.target.value.replace(/[^a-zA-Z0-9@.]/g, '');
        setData('login', filtered);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Blokir karakter tag script (< dan >) pada inputan kata sandi
        const filtered = e.target.value.replace(/[<>]/g, '');
        setData('password', filtered);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    const storeName = store?.store_name || 'Monera Coffee';
    const storeTagline = store?.tagline || 'Brewing Passion, Serving Warmth';

    return (
        <div className="min-h-screen bg-linear-to-b from-coffee-50 via-[#FDFBF7] to-crema-100/50 flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-coffee-200 selection:text-coffee-950 relative overflow-hidden">
            <Head title={`Masuk ke Portal Staf — ${storeName} (Bean & Bite)`}>
                <link rel="icon" type="image/png" href="/icon.png?v=icon-2026" />
                <link rel="shortcut icon" href="/icon.png?v=icon-2026" />
                <link rel="apple-touch-icon" href="/icon.png?v=icon-2026" />
            </Head>

            {/* Ambient Background Decorative Blurs */}
            <div className="absolute -top-32 -left-32 w-80 h-80 sm:w-96 sm:h-96 bg-crema-300/35 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 sm:w-96 sm:h-96 bg-coffee-300/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-crema-200/20 rounded-full blur-[100px] pointer-events-none" />

            {/* Main Form Container */}
            <div className="w-full max-w-[420px] relative z-10 transition-all duration-300">
                {/* Elevated Glass Card */}
                <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-coffee-200/90 shadow-2xl shadow-coffee-950/10 p-6 sm:p-9 pt-9 relative transition-all duration-300 hover:shadow-coffee-950/15">
                    
                    {/* Top Center Icon.png */}
                    <div className="flex flex-col items-center -mt-17 mb-6">
                        <div className="relative group">
                            {/* Ambient Glow behind icon */}
                            <div className="absolute -inset-1 bg-linear-to-r from-coffee-600 via-crema-500 to-coffee-800 rounded-3xl blur-md opacity-35 group-hover:opacity-60 transition duration-500" />
                            
                            {/* Icon Container */}
                            <div className="relative w-20 h-20 sm:w-22 sm:h-22 bg-white rounded-3xl p-3 border-2 border-coffee-200 shadow-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:border-coffee-400">
                                <img
                                    src="/icon.png"
                                    alt="Monera Coffee Logo"
                                    className="w-full h-full object-contain drop-shadow-xs select-none"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/images/icon.png';
                                    }}
                                />
                            </div>
                        </div>

                        {/* Title & Tagline */}
                        <div className="text-center mt-4 space-y-1">
                            <h1 className="text-2xl font-black text-coffee-950 tracking-tight">
                                {storeName}
                            </h1>
                            <p className="text-xs text-coffee-600 max-w-xs mx-auto leading-relaxed">
                                {storeTagline}
                            </p>
                        </div>
                    </div>

                    {/* Flash Message Sukses */}
                    {flash?.success && (
                        <div className="mb-4 p-3 rounded-2xl bg-matcha-50/90 border border-matcha-200 text-matcha-800 text-xs flex items-center gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-matcha-600 shrink-0" />
                            <span className="font-medium">{flash.success}</span>
                        </div>
                    )}

                    {/* Flash Message Error / Warning */}
                    {(flash?.error || flash?.warning) && (
                        <div className="mb-4 p-3 rounded-2xl bg-berry-50/90 border border-berry-200 text-berry-800 text-xs flex items-center gap-2.5">
                            <AlertCircle className="w-4 h-4 text-berry-600 shrink-0" />
                            <span className="font-medium">{flash.error || flash.warning}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        {/* Honeypot Anti-Bot Field (Hidden) */}
                        <div style={{ display: 'none' }} aria-hidden="true">
                            <label htmlFor="phone_extra">Jangan isi kolom ini</label>
                            <input
                                id="phone_extra"
                                type="text"
                                name="phone_extra"
                                value={data.phone_extra}
                                onChange={(e) => setData('phone_extra', e.target.value)}
                                tabIndex={-1}
                                autoComplete="off"
                            />
                        </div>

                        {/* Input Username / Email */}
                        <div>
                            <Input
                                label="Username atau Email"
                                placeholder="Masukkan username atau email..."
                                leftIcon={<User className="w-4 h-4 text-coffee-400" />}
                                value={data.login}
                                onChange={handleLoginChange}
                                error={errors.login}
                                autoComplete="username"
                                autoFocus
                                required
                                pattern="[a-zA-Z0-9@.]+"
                                title="Hanya huruf, angka, simbol @, dan titik (.) yang diizinkan"
                            />
                        </div>

                        {/* Input Password */}
                        <div>
                            <Input
                                id="password-input"
                                label="Kata Sandi (Password)"
                                placeholder="Masukkan kata sandi..."
                                leftIcon={<Lock className="w-4 h-4 text-coffee-400" />}
                                isPassword={true}
                                value={data.password}
                                onChange={handlePasswordChange}
                                error={errors.password}
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center text-xs pt-1">
                            <label className="flex items-center gap-2.5 text-coffee-800 cursor-pointer select-none group">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="w-4 h-4 rounded-md border-coffee-300 text-coffee-900 focus:ring-coffee-700/30 accent-coffee-900 cursor-pointer transition-colors"
                                />
                                <span className="font-semibold text-coffee-700 group-hover:text-coffee-950 transition-colors">
                                    Ingat Sesi Saya
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                className="w-full shadow-lg shadow-coffee-900/20 hover:shadow-coffee-900/30 font-bold tracking-wide transition-all duration-200 active:scale-[0.99] cursor-pointer"
                                isLoading={processing}
                                rightIcon={<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                            >
                                {processing ? 'Memverifikasi...' : 'Masuk ke Sistem'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Minimalist Aesthetic Footer */}
                <div className="mt-5 text-center text-xs text-coffee-500/80 space-y-1">
                    <p className="text-[11px] font-medium tracking-wide">
                        &copy; 2026 {storeName} • Powered by Bean &amp; Bite
                    </p>
                </div>
            </div>
        </div>
    );
}
