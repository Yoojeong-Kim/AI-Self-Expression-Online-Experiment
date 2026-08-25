import { ImageType } from '@/types/experiment';

export function getStimulusImageUrl(gender?: string, imageType: ImageType = 'A'): string {
  const g = (gender || '').toLowerCase();
  const isFemale = g === 'female' || g === '여성' || g.startsWith('여');
  const isMale = g === 'male' || g === '남성' || g.startsWith('남');

  if (isFemale) {
    return imageType === 'B' ? '/stimuli/female_b.png' : '/stimuli/female_a.png';
  } else if (isMale) {
    return imageType === 'B' ? '/stimuli/male_b.png' : '/stimuli/male_a.png';
  }

  // Fallback default
  return imageType === 'B' ? '/stimuli/female_b.png' : '/stimuli/female_a.png';
}
