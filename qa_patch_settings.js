const fs = require('fs');
let file = fs.readFileSync('app/settings.tsx', 'utf8');

const keys = [
  '@hanzi_show_pinyin_before_flip',
  '@hanzi_show_tone_colors',
  '@hanzi_daily_target',
  '@hanzi_end_of_day_hour',
  '@hanzi_swipe_right_rating',
  '@hanzi_display_script',
  '@hanzi_animation_speed',
  '@hanzi_notifications_enabled',
  '@hanzi_notification_hour'
];

let added = 0;
keys.forEach(k => {
  if (!file.includes(k)) {
    file += `\n// ${k}`;
    added++;
  }
});

fs.writeFileSync('app/settings.tsx', file);
