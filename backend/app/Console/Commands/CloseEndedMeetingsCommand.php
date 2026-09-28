<?php

namespace App\Console\Commands;

use App\Services\MeetService;
use Illuminate\Console\Command;

class CloseEndedMeetingsCommand extends Command
{
    protected $signature = 'meet:close-ended';

    protected $description = 'Close meetings past their scheduled end time and notify participants';

    public function handle(MeetService $meetService): int
    {
        $this->info('Checking for ended meetings...');
        $count = $meetService->closeEndedMeetings();
        $this->info("Closed {$count} ended meeting(s).");

        return Command::SUCCESS;
    }
}
