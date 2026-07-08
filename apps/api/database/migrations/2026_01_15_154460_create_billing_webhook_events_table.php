<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_webhook_events', function (Blueprint $table) {
            $table->id();
            $table->string('provider');
            $table->string('event_id')->nullable();
            $table->string('signature')->nullable();
            $table->json('payload');
            $table->dateTime('received_at');
            $table->dateTime('processed_at')->nullable();
            $table->enum('status', ['RECEIVED', 'PROCESSED', 'FAILED']);
            $table->text('error')->nullable();
            $table->timestamps();

            $table->unique(['provider', 'event_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_webhook_events');
    }
};
