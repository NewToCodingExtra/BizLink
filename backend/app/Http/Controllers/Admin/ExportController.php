<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\Opportunity;
use App\Models\Report;
use App\Models\User;
use App\Models\VerificationRequest;
use App\Services\ExcelExportService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function __construct(private ExcelExportService $excel) {}

    public function users(Request $request): BinaryFileResponse|StreamedResponse
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        AdminAction::log($request->user()->id, 'export.users', 'User', null, 'Exported users dataset');

        $format = strtolower($request->query('format', 'xlsx'));
        $dateStr = date('Y-m-d');

        $headers = [
            'User ID',
            'Full Name',
            'Username',
            'Email Address',
            'Account Role',
            'Account Status',
            'Verified Brand',
            'Active Warnings',
            'Suspended Until',
            'Banned At',
            'Joined Date',
        ];

        $colWidths = [10, 26, 22, 32, 16, 16, 18, 16, 22, 22, 22];

        if ($format === 'csv') {
            $respHeaders = [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"bizlink-users-{$dateStr}.csv\"",
                'Pragma' => 'no-cache',
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                'Expires' => '0',
            ];

            return response()->stream(function () use ($headers) {
                $handle = fopen('php://output', 'w');
                // Prepend UTF-8 BOM so Excel opens special characters correctly
                fwrite($handle, "\xEF\xBB\xBF");
                fputcsv($handle, $headers);

                User::chunk(200, function ($users) use ($handle) {
                    foreach ($users as $u) {
                        fputcsv($handle, [
                            $u->id,
                            $u->name,
                            '@' . $u->username,
                            $u->email,
                            ucfirst($u->role),
                            strtoupper($u->status ?? 'active'),
                            $u->is_brand_verified ? 'Verified' : 'Unverified',
                            $u->warning_count,
                            $u->suspended_until ? $u->suspended_until->format('Y-m-d H:i') : '',
                            $u->banned_at ? $u->banned_at->format('Y-m-d H:i') : '',
                            $u->created_at ? $u->created_at->format('Y-m-d H:i') : '',
                        ]);
                    }
                });

                fclose($handle);
            }, 200, $respHeaders);
        }

        // Default: Beautiful styled Excel Workbook (.xlsx)
        $dataRows = [];
        User::chunk(500, function ($users) use (&$dataRows) {
            foreach ($users as $u) {
                $dataRows[] = [
                    $u->id,
                    $u->name,
                    '@' . $u->username,
                    $u->email,
                    ucfirst($u->role),
                    strtoupper($u->status ?? 'active'),
                    $u->is_brand_verified ? 'Verified' : 'Unverified',
                    $u->warning_count,
                    $u->suspended_until ? $u->suspended_until->format('Y-m-d H:i') : '—',
                    $u->banned_at ? $u->banned_at->format('Y-m-d H:i') : '—',
                    $u->created_at ? $u->created_at->format('Y-m-d H:i') : '—',
                ];
            }
        });

        $filePath = $this->excel->generate('Users Directory', $headers, $dataRows, $colWidths);

        return response()->download(
            $filePath,
            "bizlink-users-{$dateStr}.xlsx",
            ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
        )->deleteFileAfterSend(true);
    }

    public function reports(Request $request): BinaryFileResponse|StreamedResponse
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        AdminAction::log($request->user()->id, 'export.reports', 'Report', null, 'Exported moderation reports dataset');

        $format = strtolower($request->query('format', 'xlsx'));
        $dateStr = date('Y-m-d');

        $headers = [
            'Report ID',
            'Reporter Name',
            'Reporter Email',
            'Target Type',
            'Target ID',
            'Violation Category',
            'Severity',
            'Review Status',
            'Priority Score',
            'Action Taken',
            'Admin Review Note',
            'Reported At',
            'Resolved At',
        ];

        $colWidths = [12, 24, 28, 16, 12, 24, 12, 16, 14, 22, 35, 22, 22];

        if ($format === 'csv') {
            $respHeaders = [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"bizlink-reports-{$dateStr}.csv\"",
                'Pragma' => 'no-cache',
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                'Expires' => '0',
            ];

            return response()->stream(function () use ($headers) {
                $handle = fopen('php://output', 'w');
                fwrite($handle, "\xEF\xBB\xBF");
                fputcsv($handle, $headers);

                Report::with(['reporter', 'category'])->chunk(200, function ($reports) use ($handle) {
                    foreach ($reports as $r) {
                        fputcsv($handle, [
                            $r->id,
                            $r->reporter?->name ?? 'Unknown',
                            $r->reporter?->email ?? '',
                            ucfirst($r->reportable_type),
                            $r->reportable_id,
                            $r->category?->label ?? (string) $r->category_id,
                            $r->category?->severity ?? 0,
                            strtoupper($r->status),
                            $r->priority_score,
                            $r->action_taken ?? '',
                            $r->admin_note ?? '',
                            $r->created_at ? $r->created_at->format('Y-m-d H:i') : '',
                            $r->resolved_at ? $r->resolved_at->format('Y-m-d H:i') : '',
                        ]);
                    }
                });

                fclose($handle);
            }, 200, $respHeaders);
        }

        $dataRows = [];
        Report::with(['reporter', 'category'])->chunk(500, function ($reports) use (&$dataRows) {
            foreach ($reports as $r) {
                $dataRows[] = [
                    $r->id,
                    $r->reporter?->name ?? 'Unknown',
                    $r->reporter?->email ?? '—',
                    ucfirst($r->reportable_type),
                    $r->reportable_id,
                    $r->category?->label ?? (string) $r->category_id,
                    $r->category?->severity ?? 0,
                    strtoupper($r->status),
                    $r->priority_score,
                    $r->action_taken ?? '—',
                    $r->admin_note ?? '—',
                    $r->created_at ? $r->created_at->format('Y-m-d H:i') : '—',
                    $r->resolved_at ? $r->resolved_at->format('Y-m-d H:i') : '—',
                ];
            }
        });

        $filePath = $this->excel->generate('Moderation Reports', $headers, $dataRows, $colWidths);

        return response()->download(
            $filePath,
            "bizlink-reports-{$dateStr}.xlsx",
            ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
        )->deleteFileAfterSend(true);
    }

    public function verifications(Request $request): BinaryFileResponse|StreamedResponse
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        AdminAction::log($request->user()->id, 'export.verifications', 'VerificationRequest', null, 'Exported verification requests dataset');

        $format = strtolower($request->query('format', 'xlsx'));
        $dateStr = date('Y-m-d');

        $headers = [
            'Request ID',
            'Business / Brand Name',
            'Applicant Name',
            'Applicant Email',
            'Review Status',
            'Applicant Notes',
            'Admin Review Notes',
            'Submitted At',
            'Reviewed At',
        ];

        $colWidths = [12, 28, 24, 28, 16, 35, 35, 22, 22];

        if ($format === 'csv') {
            $respHeaders = [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"bizlink-verifications-{$dateStr}.csv\"",
                'Pragma' => 'no-cache',
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                'Expires' => '0',
            ];

            return response()->stream(function () use ($headers) {
                $handle = fopen('php://output', 'w');
                fwrite($handle, "\xEF\xBB\xBF");
                fputcsv($handle, $headers);

                VerificationRequest::with(['user'])->chunk(200, function ($reqs) use ($handle) {
                    foreach ($reqs as $r) {
                        fputcsv($handle, [
                            $r->id,
                            $r->business_name,
                            $r->user?->name ?? 'Unknown',
                            $r->user?->email ?? '',
                            strtoupper($r->status),
                            $r->notes ?? '',
                            $r->admin_note ?? '',
                            $r->created_at ? $r->created_at->format('Y-m-d H:i') : '',
                            $r->resolved_at ? $r->resolved_at->format('Y-m-d H:i') : '',
                        ]);
                    }
                });

                fclose($handle);
            }, 200, $respHeaders);
        }

        $dataRows = [];
        VerificationRequest::with(['user'])->chunk(500, function ($reqs) use (&$dataRows) {
            foreach ($reqs as $r) {
                $dataRows[] = [
                    $r->id,
                    $r->business_name,
                    $r->user?->name ?? 'Unknown',
                    $r->user?->email ?? '—',
                    strtoupper($r->status),
                    $r->notes ?? '—',
                    $r->admin_note ?? '—',
                    $r->created_at ? $r->created_at->format('Y-m-d H:i') : '—',
                    $r->resolved_at ? $r->resolved_at->format('Y-m-d H:i') : '—',
                ];
            }
        });

        $filePath = $this->excel->generate('Brand Verifications', $headers, $dataRows, $colWidths);

        return response()->download(
            $filePath,
            "bizlink-verifications-{$dateStr}.xlsx",
            ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
        )->deleteFileAfterSend(true);
    }

    public function auditLogs(Request $request): BinaryFileResponse|StreamedResponse
    {
        abort_unless($request->user()?->can('users.manage'), 403, 'Admin access only.');

        $format = strtolower($request->query('format', 'xlsx'));
        $dateStr = date('Y-m-d');

        $headers = [
            'Log ID',
            'Administrator',
            'Action Code',
            'Target Entity',
            'Target ID',
            'Justification / Reason',
            'IP Address',
            'Timestamp',
        ];

        $colWidths = [10, 24, 24, 18, 12, 35, 18, 22];

        if ($format === 'csv') {
            $respHeaders = [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"bizlink-audit-logs-{$dateStr}.csv\"",
                'Pragma' => 'no-cache',
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                'Expires' => '0',
            ];

            return response()->stream(function () use ($headers) {
                $handle = fopen('php://output', 'w');
                fwrite($handle, "\xEF\xBB\xBF");
                fputcsv($handle, $headers);

                AdminAction::with('admin')->chunk(200, function ($logs) use ($handle) {
                    foreach ($logs as $l) {
                        fputcsv($handle, [
                            $l->id,
                            $l->admin?->name ?? 'System',
                            $l->action,
                            $l->target_type ?? '',
                            $l->target_id ?? '',
                            $l->reason ?? '',
                            $l->ip_address ?? '',
                            $l->created_at ? $l->created_at->format('Y-m-d H:i') : '',
                        ]);
                    }
                });

                fclose($handle);
            }, 200, $respHeaders);
        }

        $dataRows = [];
        AdminAction::with('admin')->chunk(500, function ($logs) use (&$dataRows) {
            foreach ($logs as $l) {
                $dataRows[] = [
                    $l->id,
                    $l->admin?->name ?? 'System',
                    $l->action,
                    $l->target_type ?? '—',
                    $l->target_id ?? '—',
                    $l->reason ?? '—',
                    $l->ip_address ?? '—',
                    $l->created_at ? $l->created_at->format('Y-m-d H:i') : '—',
                ];
            }
        });

        $filePath = $this->excel->generate('Admin Audit Logs', $headers, $dataRows, $colWidths);

        return response()->download(
            $filePath,
            "bizlink-audit-logs-{$dateStr}.xlsx",
            ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
        )->deleteFileAfterSend(true);
    }
}
