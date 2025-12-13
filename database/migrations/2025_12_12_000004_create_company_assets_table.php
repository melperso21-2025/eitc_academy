<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_assets', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->text('image_url');
            $table->string('storage_path', 512)->nullable();
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_assets');
    }
};
