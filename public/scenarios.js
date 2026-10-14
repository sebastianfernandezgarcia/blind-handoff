// Fictional practice material. These records describe scenarios, not real incidents.
export const EXTRA_SCENARIOS = [
  {
    id: 'studio-delivery',
    title: 'The edit is due today',
    description: 'Take over a small video project: find the approved cut, relink a missing shot, and deliver captions.',
    cases: [
      {
        id: 'SD-01', title: 'Two cuts in the delivery folder', category: 'Client delivery', priority: 'Before 15:00',
        summary: 'The client needs the 45-second launch video today. Two exports are in the delivery folder.',
        source: '13:10 · Lena Brooks owns delivery. The client approved Launch_45s_v4.mp4 at 12:40. Launch_45s_FINAL.mp4 is a later internal colour test and has not been approved. Send v4 before 15:00, then save the delivery receipt in job J-218.',
        owner: 'Lena Brooks',
        action: 'Send Launch_45s_v4.mp4, approved at 12:40, before 15:00. Save the delivery receipt in job J-218. Do not send the unapproved FINAL colour test.',
        evidenceId: 'sd-approval-j218',
        evidence: {
          id: 'sd-approval-j218', title: 'J-218 approval and export list',
          body: 'Fictional production record · 13:10. Launch_45s_v4.mp4: exported 12:15, approved by client 12:40. Launch_45s_FINAL.mp4: exported 13:02, internal colour test, approval pending. Delivery deadline: 15:00. Save the delivery receipt against J-218.'
        },
        draft: {
          summary: 'The 45-second launch video is ready for delivery. Both exports are in the delivery folder.',
          owner: 'Lena Brooks', action: 'Send the final cut before 15:00 and save the receipt in J-218.', evidenceId: 'sd-approval-j218'
        }
      },
      {
        id: 'SD-02', title: 'A shot is offline in the edit', category: 'Media preparation', priority: 'Before 16:00',
        summary: 'The interview timeline opens, but one cutaway is offline after the media folder was moved.',
        source: '14:05 · Amir Shah will relink B014_C03.mov from Media/Day2/CamB. Check the shot at 01:12 in timeline Interview_v6 before exporting the review copy. B014_C03_proxy.mov is a proxy and should not replace the original in the final export.',
        owner: 'Amir Shah',
        action: 'Relink B014_C03.mov from Media/Day2/CamB. Check the shot at 01:12 in Interview_v6, then export the review copy before 16:00. Keep the proxy separate.',
        evidenceId: 'sd-media-m26',
        evidence: {
          id: 'sd-media-m26', title: 'Media move log M-26',
          body: 'Fictional media log · 14:05. Original B014_C03.mov moved to Media/Day2/CamB. Proxy B014_C03_proxy.mov remains in Media/Proxies. Timeline: Interview_v6. Offline shot begins at 01:12. Amir Shah accepted the relink task; review export due 16:00.'
        },
        draft: {
          summary: 'Interview_v6 has one offline cutaway after the media move.', owner: '',
          action: 'Relink B014_C03.mov from Media/Day2/CamB, check the shot at 01:12, and export the review copy before 16:00. Do not use the proxy as the original.',
          evidenceId: 'sd-media-m26'
        }
      },
      {
        id: 'SD-03', title: 'Captions for the web version', category: 'Accessibility', priority: 'Before 17:30',
        summary: 'The web team needs a clean video export and a separate English subtitle file for the approved interview.',
        source: '14:20 · Priya Cole owns the web package. Export Interview_v6_clean.mp4 and Interview_v6_en.srt from the approved Interview_v6 timeline. Check subtitle sync at the first and last spoken lines. Upload both to job W-39 before 17:30 and note the filenames in the delivery message.',
        owner: 'Priya Cole',
        action: 'Export Interview_v6_clean.mp4 and Interview_v6_en.srt from the approved timeline. Check subtitle sync at the first and last spoken lines, upload both to W-39 before 17:30, and list both filenames in the delivery message.',
        evidenceId: 'sd-web-w39',
        evidence: {
          id: 'sd-web-w39', title: 'Web delivery request W-39',
          body: 'Fictional delivery request · 14:20. Approved timeline: Interview_v6. Web player requires a video without burned-in captions plus a separate English SRT. Expected filenames: Interview_v6_clean.mp4 and Interview_v6_en.srt. Destination: job W-39. Owner: Priya Cole. Deadline: 17:30.'
        },
        draft: {
          summary: 'The approved Interview_v6 needs a clean video and a separate English SRT for the web player.', owner: 'Priya Cole',
          action: 'Export Interview_v6_clean.mp4 and Interview_v6_en.srt. Check sync at the first and last spoken lines, upload both to W-39 before 17:30, and list both filenames in the delivery message.',
          evidenceId: 'sd-web-w39'
        }
      }
    ]
  },
  {
    id: 'software-ops',
    title: 'The afternoon support shift',
    description: 'Pick up a duplicate export, a stale catalogue, and a release waiting for its final checks.',
    cases: [
      {
        id: 'SO-01', title: 'An export ran twice', category: 'Customer support', priority: 'Before 14:30',
        summary: 'A retry created two downloadable files for the same export request. Neither file has been sent to the customer.',
        source: '13:35 · Jules Carter owns ticket T-482. Export E-482-A completed and passed the row-count check. Retry E-482-B contains the same rows and was generated by a duplicate job. Share only the E-482-A download link, record both export IDs on T-482, and ask the engineering queue to investigate the duplicate job. Do not send both files.',
        owner: 'Jules Carter',
        action: 'Share only the verified E-482-A link before 14:30. Record E-482-A and duplicate E-482-B on T-482, then pass the duplicate-job details to the engineering queue.',
        evidenceId: 'so-export-t482',
        evidence: {
          id: 'so-export-t482', title: 'Ticket T-482 export check',
          body: 'Fictional support record · 13:35. E-482-A completed at 13:21: 184 rows, row count verified. E-482-B completed at 13:24: same request, same 184 rows, duplicate retry. No download link has been sent. Ticket owner: Jules Carter. Customer update due 14:30.'
        },
        draft: {
          summary: 'T-482 produced two files after a retry. Only E-482-A should be shared.', owner: '',
          action: 'Send the verified E-482-A link before 14:30. Record both export IDs on T-482 and pass the duplicate-job details to the engineering queue.',
          evidenceId: 'so-export-t482'
        }
      },
      {
        id: 'SO-02', title: 'The catalogue still shows yesterday', category: 'Content operations', priority: 'Check at 14:00',
        summary: 'The public catalogue is showing an old description even though the editor saved the new copy this morning.',
        source: '13:20 · Tessa Lin owns incident C-63. The 12:50 rebuild is complete; repeating it is not the next step. At 14:00, compare the public item page for SKU P-63 with revision 27. If it is still revision 26, attach the page response details to C-63 and escalate to the cache support queue. Do not start another rebuild while investigating.',
        owner: 'Tessa Lin',
        action: 'At 14:00, compare the public P-63 page with revision 27. If it still shows revision 26, attach the response details to C-63 and escalate to the cache support queue. Do not repeat the completed rebuild.',
        evidenceId: 'so-catalogue-c63',
        evidence: {
          id: 'so-catalogue-c63', title: 'C-63 rebuild and page checks',
          body: 'Fictional incident record · 13:20. Item P-63: revision 27 saved at 09:10. Catalogue rebuild started 12:50 and completed 13:04. Public check at 13:15 still returned revision 26. Updated instruction: check again at 14:00; if stale, collect response details and escalate to the cache support queue. No further rebuild requested.'
        },
        draft: {
          summary: 'P-63 still shows the old description on the public catalogue.', owner: 'Tessa Lin',
          action: 'At 14:00, run the catalogue rebuild again, then close C-63 if the description updates.', evidenceId: 'so-catalogue-c63'
        }
      },
      {
        id: 'SO-03', title: 'A release is waiting for review', category: 'Release coordination', priority: 'Decision at 15:00',
        summary: 'Release 2.8.1 is staged. The team needs the remaining checks before anyone requests production deployment.',
        source: '13:40 · Rafael Ortiz owns release note R-281. At 15:00, run the sign-in and CSV-export checks in staging and attach the results to R-281. If either fails, mark the release held and notify the release lead. If both pass, ask the release lead for deployment approval; passing checks alone is not approval.',
        owner: 'Rafael Ortiz',
        action: 'At 15:00, run staging sign-in and CSV-export checks and attach results to R-281. Hold the release and notify the release lead if either fails. If both pass, request the release lead’s deployment approval.',
        evidenceId: 'so-release-r281',
        evidence: {
          id: 'so-release-r281', title: 'Release checklist R-281',
          body: 'Fictional release record · 13:40. Version 2.8.1 is on staging only. Remaining checks: sign-in with the test account and CSV export of the sample catalogue. Rafael Ortiz owns the 15:00 check. Production deployment requires explicit approval from the release lead after results are attached.'
        },
        draft: {
          summary: 'Version 2.8.1 is staged; production approval is still pending.', owner: 'Rafael Ortiz',
          action: 'At 15:00, check staging sign-in and CSV export and attach results to R-281. If either fails, hold and notify the release lead. If both pass, request the release lead’s approval before deployment.',
          evidenceId: 'so-release-r281'
        }
      }
    ]
  },
  {
    id: 'bookings-events',
    title: 'Tomorrow’s workshop',
    description: 'Hand over a revised arrival time, a borrowed projector, and a full workshop with a waiting list.',
    cases: [
      {
        id: 'BE-01', title: 'The instructor arrives later', category: 'Scheduling', priority: 'Send update by 16:00',
        summary: 'Tomorrow’s workshop start has moved, but the attendee reminder still contains the original arrival time.',
        source: '14:10 · Olivia Grant owns booking B-114. The instructor and venue confirmed a 12:30 start tomorrow, with doors opening at 12:15. Replace the old reminder, which says doors at 10:45 and start at 11:00. Send the corrected times to attendees by 16:00 today and record when the update was sent.',
        owner: 'Olivia Grant',
        action: 'Replace the old B-114 reminder with doors at 12:15 and start at 12:30 tomorrow. Send the corrected times to attendees by 16:00 today and record the send time.',
        evidenceId: 'be-times-b114',
        evidence: {
          id: 'be-times-b114', title: 'B-114 confirmed schedule change',
          body: 'Fictional booking record · 14:10. Instructor and venue confirmed tomorrow’s new start: 12:30; doors: 12:15. Previous start 11:00 and doors 10:45 are superseded. The attendee reminder has not yet been updated. Olivia Grant is responsible for sending the correction by 16:00 today.'
        },
        draft: {
          summary: 'Tomorrow’s B-114 workshop is confirmed. Attendees still need their reminder.', owner: 'Olivia Grant',
          action: 'Send the saved reminder with doors at 10:45 and start at 11:00 by 16:00 today. Record the send time.', evidenceId: 'be-times-b114'
        }
      },
      {
        id: 'BE-02', title: 'A projector is coming from next door', category: 'Equipment booking', priority: 'Collect at 16:30',
        summary: 'The venue’s projector is unavailable. A neighbouring studio has reserved a replacement for tomorrow’s workshop.',
        source: '14:25 · Ben Okafor owns equipment booking AV-22. Collect projector PJ-8 from the neighbouring studio’s reception at 16:30 today. Its HDMI cable is included; bring adapter AD-2 from our equipment cupboard. Attach the loan note to the handoff so the next shift can see that PJ-8 must be returned tomorrow by 18:00.',
        owner: 'Ben Okafor',
        action: 'Collect PJ-8 and its HDMI cable from the neighbouring studio’s reception at 16:30 today. Bring adapter AD-2 from our cupboard. Return PJ-8 tomorrow by 18:00 as recorded in loan note AV-22.',
        evidenceId: 'be-loan-av22',
        evidence: {
          id: 'be-loan-av22', title: 'Projector loan note AV-22',
          body: 'Fictional loan note · 14:25. PJ-8 reserved for Ben Okafor. Collection: neighbouring studio reception, 16:30 today. Included: HDMI cable. Not included: laptop adapter; use our AD-2. Return deadline: tomorrow at 18:00 to the same reception. Booking reference: AV-22.'
        },
        draft: {
          summary: 'PJ-8 is reserved to replace the venue projector for tomorrow’s workshop.', owner: 'Ben Okafor',
          action: 'Collect PJ-8 and its HDMI cable from the neighbouring studio reception at 16:30 today. Bring our AD-2 adapter. Check the loan note for the return arrangement.',
          evidenceId: ''
        }
      },
      {
        id: 'BE-03', title: 'The last workshop seat is taken', category: 'Attendee support', priority: 'Check at 17:00',
        summary: 'All 24 workshop places are booked. One person has asked to join and is first on the waiting list.',
        source: '14:40 · Sofia Park owns attendee list W-24. Check for cancellations at 17:00. If a place opens, offer it to the first person on W-24 and hold it until 18:00. If there is no cancellation, tell them the workshop is still full. Keep the confirmed total at 24 or fewer; do not promise a place before one is released.',
        owner: 'Sofia Park',
        action: 'At 17:00, check cancellations against W-24. If a place opens, offer it to the first waiting attendee with an 18:00 reply deadline. Otherwise send a still-full update. Keep confirmed attendance at 24 or fewer.',
        evidenceId: 'be-attendees-w24',
        evidence: {
          id: 'be-attendees-w24', title: 'Attendance summary W-24',
          body: 'Fictional attendance record · 14:40. Workshop capacity: 24. Confirmed places: 24. Cancellations: none. Waiting list: one person, first in order. Sofia Park will review cancellations at 17:00. Any released seat may be held for that attendee until 18:00.'
        },
        draft: {
          summary: 'All 24 places are booked; one person is first on waiting list W-24.', owner: 'Sofia Park',
          action: 'Check cancellations at 17:00. Offer any released place to the first waiting attendee until 18:00; otherwise send a still-full update. Do not exceed 24 confirmed attendees.',
          evidenceId: 'be-attendees-w24'
        }
      }
    ]
  },
  {
    id: 'studio-maintenance',
    title: 'Closing the studio',
    description: 'Leave a clear handoff for a backup check, a loan kit due back, and a battery awaiting inspection.',
    cases: [
      {
        id: 'SM-01', title: 'The backup has copied, but is not checked', category: 'Media storage', priority: 'Before 18:00',
        summary: 'The shoot folder has finished copying to the backup drive. Verification is still pending.',
        source: '16:10 · Marcus Bell owns backup BK-41. Compare the backup copy of Shoot_41 with manifest M-41 and open the first and last clip before marking the backup verified. Keep the source drive until verification is recorded. If any item fails, leave BK-41 open and note the affected filenames for the next shift.',
        owner: 'Marcus Bell',
        action: 'Before 18:00, compare the Shoot_41 backup with manifest M-41 and open the first and last clip. Record the result in BK-41. Keep the source drive; leave the task open with affected filenames if any check fails.',
        evidenceId: 'sm-backup-bk41',
        evidence: {
          id: 'sm-backup-bk41', title: 'Backup checklist BK-41',
          body: 'Fictional backup record · 16:10. Shoot_41 copy completed at 16:02. Manifest M-41 lists 86 files; comparison has not run. Playback checks for first clip A001.mov and last clip A086.mov are pending. Marcus Bell owns verification before 18:00. Source drive must remain available until verification is recorded.'
        },
        draft: {
          summary: 'Shoot_41 has copied to the backup drive. Verification is pending and the source drive must stay available.',
          owner: 'Marcus Bell', action: '', evidenceId: 'sm-backup-bk41'
        }
      },
      {
        id: 'SM-02', title: 'The borrowed audio kit is due back', category: 'Equipment returns', priority: 'Before 17:00',
        summary: 'The interview kit is packed, but the lender has brought its return time forward for another booking.',
        source: '16:15 · Nina Reed owns loan L-18. The lender changed return from 19:00 to 17:00 today and Nina acknowledged the change. Check recorder AR-6, two microphones, and two cables against L-18, return them to the lender’s front desk by 17:00, and save the signed receipt.',
        owner: 'Nina Reed',
        action: 'Check AR-6, two microphones, and two cables against L-18. Return the complete kit to the lender’s front desk by the revised 17:00 deadline today and save the signed receipt.',
        evidenceId: 'sm-loan-l18',
        evidence: {
          id: 'sm-loan-l18', title: 'L-18 revised return note',
          body: 'Fictional loan record · 16:15. Return deadline changed from 19:00 to 17:00 today; Nina Reed acknowledged at 16:12. Kit contents: recorder AR-6, two microphones, two cables. Return location: lender’s front desk. A signed receipt is required to close L-18.'
        },
        draft: {
          summary: 'The L-18 interview kit is packed and ready to return.', owner: 'Nina Reed',
          action: 'Check AR-6, two microphones, and two cables, then return the kit to the lender’s front desk by 19:00 today. Save the signed receipt.',
          evidenceId: 'sm-loan-l18'
        }
      },
      {
        id: 'SM-03', title: 'One battery is on hold', category: 'Equipment status', priority: 'Before next checkout',
        summary: 'A camera battery reported an intermittent error during a shoot. The equipment desk has marked it unavailable pending inspection.',
        source: '16:30 · Owen Ellis owns equipment ticket EQ-73. Battery B-17 is labelled HOLD and must stay out of checkout kits until the equipment desk records an inspection and releases it. Confirm the reservation for tomorrow uses available battery B-21 instead, and keep EQ-73 open for the desk’s inspection result. No repair is assigned to the incoming shift.',
        owner: 'Owen Ellis',
        action: 'Keep B-17 marked HOLD and out of checkout kits. Confirm tomorrow’s reservation uses available B-21. Leave EQ-73 open until the equipment desk records the inspection result and explicitly releases B-17.',
        evidenceId: 'sm-equipment-eq73',
        evidence: {
          id: 'sm-equipment-eq73', title: 'Equipment status ticket EQ-73',
          body: 'Fictional equipment record · 16:30. B-17: intermittent error reported, status HOLD, inspection pending with equipment desk. B-21: available and reserved as the replacement for tomorrow. Owner: Owen Ellis. B-17 cannot return to checkout stock until the desk records its inspection and release.'
        },
        draft: {
          summary: 'B-17 is on HOLD pending equipment-desk inspection. B-21 is reserved as tomorrow’s replacement.', owner: 'Owen Ellis',
          action: 'Keep B-17 out of checkout kits, confirm tomorrow’s reservation uses B-21, and leave EQ-73 open until the equipment desk records its inspection and releases B-17.',
          evidenceId: 'sm-equipment-eq73'
        }
      }
    ]
  }
];
