<?php

namespace App\Services;

use App\Events\NotificationCreated;
use App\Models\AppNotification;

/**
 * Single choke point for user notifications: persists the row and fans out
 * a private-user broadcast for the live bell bump. Callers never touch
 * AppNotification directly for new types.
 */
class NotificationService
{
    public function push(int $userId, string $type, string $message, ?string $link = null): AppNotification
    {
        $notification = AppNotification::create([
            'user_id' => $userId,
            'type' => $type,
            'message' => $message,
            'link' => $link,
            'read' => false,
        ]);

        broadcast(new NotificationCreated($notification));

        return $notification;
    }
}
