<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property string $name
 * @property string $username
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string $role (pemilik, admin_kasir, barista_koki)
 * @property string|null $phone
 * @property string|null $avatar
 * @property bool $is_active
 * @property Carbon|null $last_login_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'role',
        'phone',
        'avatar',
        'is_active',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'avatar_url',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Booted model events untuk Proteksi Akun Super Admin & Privilege Escalation
     */
    protected static function booted(): void
    {
        static::updating(function (User $user) {
            // Jika user adalah akun Super Admin utama (id = 1 atau role awal pemilik)
            if ($user->getOriginal('id') === 1 || $user->getOriginal('role') === 'pemilik') {
                // Proteksi: Super Admin tidak boleh dinonaktifkan
                if ($user->isDirty('is_active') && ! $user->is_active) {
                    throw new \InvalidArgumentException('Proteksi Keamanan: Akun Super Admin (Pemilik) tidak dapat dinonaktifkan.');
                }

                // Proteksi: Super Admin tidak boleh diturunkan rolenya (demoted)
                if ($user->isDirty('role') && $user->role !== 'pemilik') {
                    throw new \InvalidArgumentException('Proteksi Keamanan: Role akun Super Admin tidak dapat diubah.');
                }
            }
        });

        static::deleting(function (User $user) {
            if ($user->id === 1 || $user->role === 'pemilik') {
                throw new \InvalidArgumentException('Proteksi Keamanan: Akun Super Admin utama tidak dapat dihapus dari sistem.');
            }
        });
    }

    /**
     * Accessor untuk URL foto profil user
     */
    public function getAvatarUrlAttribute(): string
    {
        if ($this->avatar && Storage::disk('public')->exists($this->avatar)) {
            return '/storage/' . ltrim($this->avatar, '/');
        }

        // Default avatar initials via UI Avatars
        $name = urlencode($this->name);
        return "https://ui-avatars.com/api/?name={$name}&color=7F4F24&background=EDE0D4";
    }

    /**
     * Role check helpers
     */
    public function isPemilik(): bool
    {
        return $this->role === 'pemilik';
    }

    public function isAdminKasir(): bool
    {
        return $this->role === 'admin_kasir';
    }

    public function isBaristaKoki(): bool
    {
        return $this->role === 'barista_koki';
    }

    /**
     * Relasi ke Cash Shifts
     */
    public function cashShifts(): HasMany
    {
        return $this->hasMany(CashShift::class);
    }

    /**
     * Relasi ke Orders yang dicatat
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Relasi ke Payments yang diproses
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Relasi ke Audit Logs
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }
}
