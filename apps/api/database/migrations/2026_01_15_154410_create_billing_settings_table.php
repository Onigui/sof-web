<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->integer('monthly_fee_centavos')->default(0);
            $table->integer('per_integrada_centavos')->default(0);
            $table->string('currency')->default('BRL');
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->unique('empresa_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_settings');
    }
};
