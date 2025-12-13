<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Representa un curso y sus vínculos con categorías, favoritos, comentarios e inscripciones.
 */
class Course extends Model
{
    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'price',
        'discount_amount',
        'discount_percent',
        'image_url',
        'modality',
        'level',
        'certificate',
        'duration_hours',
        'syllabus',
        'is_published',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'discount_percent' => 'decimal:2',
        'is_published' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function favorites()
    {
        return $this->hasMany(Favorite::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function enrolledUsers()
    {
        return $this->belongsToMany(User::class, 'enrollments');
    }

    public function isFavoritedBy($userId)
    {
        // Reutiliza la relación para determinar si el usuario ha marcado favorito
        return $this->favorites()->where('user_id', $userId)->exists();
    }
}
