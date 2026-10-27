-- Start tracking missed days now, keeping any reviews already answered.
-- Imported historical tasks do not generate years of retroactive reminders.
UPDATE workspace
SET data=json_set(data,
  '$.state.dailyReviewStartDate',min(date('now','-3 hours','-1 day'),coalesce(
    (SELECT min(json_extract(value,'$.date')) FROM json_each(workspace.data,'$.state.dailyReviews')),
    date('now','-3 hours','-1 day'))),
  '$.state.revision',revision+1),
  revision=revision+1
WHERE json_type(data,'$.state.dailyReviewStartDate') IS NULL;
