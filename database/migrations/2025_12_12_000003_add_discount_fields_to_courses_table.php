<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->decimal('discount_amount', 10, 2)->nullable()->after('price');
            $table->decimal('discount_percent', 5, 2)->nullable()->after('discount_amount');
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['discount_amount', 'discount_percent']);
        });
    }
};
