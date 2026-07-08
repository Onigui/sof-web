<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('empresa_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->enum('status', ['TRIAL', 'ATIVA', 'SUSPENSA'])->default('TRIAL');
            $table->dateTime('trial_ends_at')->nullable();
            $table->dateTime('active_since')->nullable();
            $table->dateTime('suspended_at')->nullable();
            $table->integer('grace_days')->default(0);
            $table->timestamps();

            $table->unique('empresa_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('empresa_subscriptions');
    }
};
