<?php

namespace App\Contracts;

use App\Models\User;
use Carbon\Carbon;

interface CalendarAdapter
{
    /**
     * @return array{eventId: string, link: string}
     */
    public function createMeet(User $u, string $t, Carbon $s, int $mins): array;

    public function cancel(User $u, string $eventId): void;

    public function ended(string $eventId): bool;
}
