
export const mockProfiles = {
  'demo-ryan-martinez': {
    id: 'demo-ryan-martinez',
    display_name: 'Ryan Martinez',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Powerlifting enthusiast. Always chasing PRs 💪 5 years of lifting experience. Love helping newbies get started!',
    fitness_level: 'Advanced',
    vibe: 'Powerlifting Beast',
    preferred_workouts: ['Weight Training', 'Powerlifting', 'Strength Training'],
    fitness_goals: ['Build Muscle', 'Increase Strength', 'Perfect Form'],
    availability: ['Evening', 'Weekends'],
    verified: true,
    followers_count: 247,
    following_count: 89,
    home_gym_place_id: 'gym-golds-downtown'
  },
  'demo-sarah-chen': {
    id: 'demo-sarah-chen',
    display_name: 'Sarah Chen',
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    bio: 'Certified yoga instructor spreading zen vibes 🧘‍♀️ RYT-500. Teaching for 8 years. Mind-body connection is everything!',
    fitness_level: 'Advanced',
    vibe: 'Zen Master',
    preferred_workouts: ['Yoga', 'Pilates', 'Stretching', 'Meditation'],
    fitness_goals: ['Flexibility', 'Mental Wellness', 'Balance', 'Inner Peace'],
    availability: ['Morning', 'Evening'],
    verified: true,
    followers_count: 512,
    following_count: 156,
    home_gym_place_id: 'studio-zen-yoga'
  },
  'demo-marcus-johnson': {
    id: 'demo-marcus-johnson',
    display_name: 'Marcus Johnson',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    bio: 'CrossFit Level 2 coach. WODs are life! 🏋️‍♂️ Competed in Regionals 2x. Push your limits every day!',
    fitness_level: 'Advanced',
    vibe: 'CrossFit Warrior',
    preferred_workouts: ['CrossFit', 'HIIT', 'Weight Training', 'Metabolic Conditioning'],
    fitness_goals: ['Build Muscle', 'Endurance', 'Athletic Performance', 'Competition Prep'],
    availability: ['Morning', 'Afternoon'],
    verified: true,
    followers_count: 834,
    following_count: 203,
    home_gym_place_id: 'crossfit-iron-box'
  },
  'demo-emma-wilson': {
    id: 'demo-emma-wilson',
    display_name: 'Emma Wilson',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    bio: 'Competitive swimmer turned triathlete. Pool is my happy place 🏊‍♀️ Masters swimmer, coaching kids on weekends.',
    fitness_level: 'Advanced',
    vibe: 'Water Athlete',
    preferred_workouts: ['Swimming', 'Water Aerobics', 'Triathlon Training', 'Cardio'],
    fitness_goals: ['Endurance', 'Technique', 'Speed', 'Competition'],
    availability: ['Morning', 'Evening'],
    verified: false,
    followers_count: 198,
    following_count: 124,
    home_gym_place_id: 'aquatic-center-main'
  },
  'demo-david-thompson': {
    id: 'demo-david-thompson',
    display_name: 'David Thompson',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'Marathon runner and running coach. Every mile counts 🏃‍♂️ Boston qualifier 3x. Love trail running and mentoring runners.',
    fitness_level: 'Advanced',
    vibe: 'Endurance Runner',
    preferred_workouts: ['Running', 'Cardio', 'Trail Running', 'Speed Work'],
    fitness_goals: ['Endurance', 'Speed', 'Marathon Training', 'Weight Management'],
    availability: ['Morning', 'Weekends'],
    verified: false,
    followers_count: 156,
    following_count: 98,
    home_gym_place_id: 'fitness-first-central'
  },
  'demo-alicia-rodriguez': {
    id: 'demo-alicia-rodriguez',
    display_name: 'Alicia Rodriguez',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    bio: 'Former college basketball player turned trainer. Court is life 🏀 Specializing in agility and sports performance training.',
    fitness_level: 'Advanced',
    vibe: 'Court Dominator',
    preferred_workouts: ['Basketball', 'Sports Training', 'Agility', 'Plyometrics'],
    fitness_goals: ['Agility', 'Team Sports', 'Athletic Performance', 'Coordination'],
    availability: ['Afternoon', 'Evening'],
    verified: true,
    followers_count: 367,
    following_count: 145,
    home_gym_place_id: 'sports-complex-elite'
  }
};

export const getMockProfile = (id: string) => {
  return mockProfiles[id as keyof typeof mockProfiles] || null;
};

export const getAllMockProfiles = () => {
  return Object.values(mockProfiles);
};
