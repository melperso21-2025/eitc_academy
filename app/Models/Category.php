<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Agrupa cursos y permite consultas por slug y descripción.
 */
class Category extends Model
{
    protected $fillable = ['name', 'slug', 'description'];

    public function courses()
    {
        return $this->hasMany(Course::class);
    }
}
