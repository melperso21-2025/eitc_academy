<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanyAsset extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'description',
        'image_url',
        'storage_path',
        'display_order',
    ];
}
