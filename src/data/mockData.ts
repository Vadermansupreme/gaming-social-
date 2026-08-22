// Mock data for the SpotMe app
export const mockPosts = [
  {
    id: 1,
    user: {
      name: "Ryan Reynolds",
      location: "Vancouver, BC",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      initials: "RR"
    },
    timeAgo: "2 hours ago",
    content: "That awkward moment when you realize you've been doing squats wrong for 2 years. 😅 Blake laughed at me for 10 minutes straight. At least my form is perfect now! Never too late to learn.",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=600&fit=crop",
    likes: 1234,
    comments: 89,
    workoutType: "Strength",
    hashtags: ["fitness", "learning", "humility", "marriedlife"]
  },
  {
    id: 2,
    user: {
      name: "Zendaya",
      location: "Los Angeles, CA",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      initials: "Z",
    },
    timeAgo: "4 hours ago",
    content: "Sunday self-care day ✨ Started with yoga, made my grandma's famous pancakes, and now binge-watching The Great British Bake Off. Balance is everything!",
    image: "https://images.unsplash.com/photo-1506629905607-24eb9cc13d65?w=600&h=600&fit=crop",
    likes: 2156,
    comments: 234,
    workoutType: "Yoga",
    hashtags: ["selfcare", "sunday", "balance", "family"]
  },
  {
    id: 3,
    user: {
      name: "The Rock",
      location: "Miami, FL",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      initials: "DJ"
    },
    timeAgo: "6 hours ago",
    content: "4 AM iron paradise session ✅ Tequila business meeting ✅ Surprise visit to my mom ✅ Now cooking dinner for the family. When you love what you do, it never feels like work. Stay hungry! 🍯",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=600&fit=crop",
    likes: 3421,
    comments: 156,
    workoutType: "Strength",
    hashtags: ["grind", "family", "blessed", "stayhungry"]
  },
  {
    id: 4,
    user: {
      name: "Emma Stone",
      location: "New York, NY",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      initials: "ES"
    },
    timeAgo: "8 hours ago",
    content: "Tried a new dance class today and definitely looked like a baby giraffe learning to walk 🦒 But hey, at least I had fun and burned calories while laughing at myself!",
    image: "https://images.unsplash.com/photo-1524863479829-916d8e77f114?w=600&h=600&fit=crop",
    likes: 987,
    comments: 67,
    workoutType: "Dance",
    hashtags: ["dance", "fun", "noregrets", "justdoit"]
  },
  {
    id: 5,
    user: {
      name: "Chris Hemsworth",
      location: "Byron Bay, AU",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      initials: "CH"
    },
    timeAgo: "12 hours ago",
    content: "Beach workout with the kids today! Nothing like chasing a 5-year-old around the sand to realize you're not as fit as you thought 😅 They absolutely destroyed me in a race.",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=600&fit=crop",
    likes: 1876,
    comments: 123,
    workoutType: "Outdoor",
    hashtags: ["family", "beach", "dadlife", "humbled"]
  },
  {
    id: 6,
    user: {
      name: "Jennifer Lawrence",
      location: "Louisville, KY",
      avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face",
      initials: "JL"
    },
    timeAgo: "1 day ago",
    content: "Went hiking this morning and accidentally took the 'expert' trail. Spent 3 hours lost, but hey - best cardio I've had all month! 🥾 Note to self: actually read trail maps.",
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=600&fit=crop",
    likes: 1543,
    comments: 98,
    workoutType: "Hiking",
    hashtags: ["hiking", "adventure", "oops", "cardio"]
  }
];

export const mockSpotters = [
  {
    id: 1,
    name: "Arnold",
    workoutType: "Powerlifting",
    avatar: "https://images.unsplash.com/photo-1567013127542-490d757e51cd?w=150&h=150&fit=crop&crop=face",
    initials: "AS",
    display_name: "Arnold Schwarzenegger",
    bio: "Former Mr. Olympia and action movie star. Always ready to pump some iron and share training wisdom!",
    fitness_level: "Expert",
    experience_level: "Professional",
    preferred_workouts: ["Powerlifting", "Bodybuilding", "Strength Training"],
    fitness_goals: ["Build Muscle", "Strength", "Competition Prep"],
    availability: ["Morning", "Afternoon"],
    followers_count: 15000,
    following_count: 500,
    verified: true,
    vibe: "Serious Trainer",
    cover_image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop"
  },
  {
    id: 2,
    name: "Jennifer",
    workoutType: "CrossFit",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    initials: "JL",
    display_name: "Jennifer Lawrence",
    bio: "Actress and fitness enthusiast. Love high-intensity workouts and making fitness fun!",
    fitness_level: "Advanced",
    experience_level: "Intermediate",
    preferred_workouts: ["CrossFit", "HIIT", "Functional Training"],
    fitness_goals: ["Endurance", "Functional Strength", "Have Fun"],
    availability: ["Evening", "Weekend"],
    followers_count: 8500,
    following_count: 350,
    verified: true,
    vibe: "Fun & Energetic",
    cover_image_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=400&fit=crop"
  },
  {
    id: 3,
    name: "Ryan",
    workoutType: "Calisthenics",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    initials: "RR",
    display_name: "Ryan Reynolds",
    bio: "Actor and smart-mouth. Training for superhero roles and making inappropriate jokes along the way.",
    fitness_level: "Advanced",
    experience_level: "Intermediate",
    preferred_workouts: ["Calisthenics", "Combat Training", "Cardio"],
    fitness_goals: ["Lean Muscle", "Flexibility", "Movie Prep"],
    availability: ["Morning", "Afternoon"],
    followers_count: 12000,
    following_count: 200,
    verified: true,
    vibe: "Witty & Motivated",
    cover_image_url: "https://images.unsplash.com/photo-1506629905607-24eb9cc13d65?w=800&h=400&fit=crop"
  },
  {
    id: 4,
    name: "Gal",
    workoutType: "Martial Arts",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    initials: "GG",
    display_name: "Gal Gadot",
    bio: "Wonder Woman actress and martial arts expert. Training heroes one workout at a time!",
    fitness_level: "Expert",
    experience_level: "Advanced",
    preferred_workouts: ["Martial Arts", "Combat Training", "Strength Training"],
    fitness_goals: ["Coordination", "Strength", "Flexibility"],
    availability: ["Morning", "Evening"],
    followers_count: 20000,
    following_count: 150,
    verified: true,
    vibe: "Empowering & Strong",
    cover_image_url: "https://images.unsplash.com/photo-1524863479829-916d8e77f114?w=800&h=400&fit=crop"
  },
  {
    id: 5,
    name: "Will",
    workoutType: "Swimming",
    avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face",
    initials: "WS",
    display_name: "Will Smith",
    bio: "Actor and fitness enthusiast. Swimming my way to greatness and inspiring others to do the same!",
    fitness_level: "Advanced",
    experience_level: "Intermediate",
    preferred_workouts: ["Swimming", "Cardio", "Boxing"],
    fitness_goals: ["Endurance", "Weight Loss", "Mental Health"],
    availability: ["Morning", "Weekend"],
    followers_count: 9500,
    following_count: 400,
    verified: true,
    vibe: "Inspiring & Positive",
    cover_image_url: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=400&fit=crop"
  },
  {
    id: 6,
    name: "Scarlett",
    workoutType: "Yoga",
    avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face",
    initials: "SJ",
    display_name: "Scarlett Johansson",
    bio: "Black Widow actress and yoga practitioner. Finding balance through mindful movement and meditation.",
    fitness_level: "Advanced",
    experience_level: "Advanced",
    preferred_workouts: ["Yoga", "Pilates", "Flexibility Training"],
    fitness_goals: ["Flexibility", "Mental Health", "Balance"],
    availability: ["Morning", "Evening"],
    followers_count: 11000,
    following_count: 300,
    verified: true,
    vibe: "Mindful & Zen",
    cover_image_url: "https://images.unsplash.com/photo-1506629905607-24eb9cc13d65?w=800&h=400&fit=crop"
  }
];

export const mockTrainers = [
  {
    id: 1,
    name: "Hugh Jackman",
    distance: "0.3 miles away",
    rating: 4.9,
    reviews: 156,
    match: "98% match",
    experience: "Expert",
    workouts: ["Wolverine Training", "HIIT", "Strength"],
    goals: ["Build Muscle", "Movie Prep", "Athletic Performance"],
    availability: ["Morning", "Afternoon"],
    avatar: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=150&h=150&fit=crop&crop=face",
    initials: "HJ"
  },
  {
    id: 2,
    name: "Gal Gadot",
    distance: "0.7 miles away",
    rating: 4.8,
    reviews: 89,
    match: "94% match",
    experience: "Advanced",
    workouts: ["Combat Training", "Functional Fitness", "Flexibility"],
    goals: ["Improve Form", "Coordination", "Endurance"],
    availability: ["Evening", "Weekend"],
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    initials: "GG"
  }
];

export const mockGyms = [
  {
    id: 1,
    name: "Equinox",
    address: "123 Fitness Ave, New York, NY",
    distance: "0.4 miles away",
    rating: 4.7,
    amenities: ["Pool", "Sauna", "Personal Training", "Group Classes"],
    moreAmenities: 8,
    monthlyPrice: 89.99,
    annualPrice: 899.99,
    hours: "5:00 AM - 11:00 PM",
    phone: "(555) 123-4567"
  },
  {
    id: 2,
    name: "Gold's Gym",
    address: "456 Muscle St, New York, NY",
    distance: "0.8 miles away",
    rating: 4.5,
    amenities: ["24/7 Access", "Free Weights", "Cardio Equipment", "Lockers"],
    moreAmenities: 6,
    monthlyPrice: 59.99,
    annualPrice: 599.99,
    hours: "24/7",
    phone: "(555) 987-6543"
  },
  {
    id: 3,
    name: "Planet Fitness",
    address: "789 Strength Blvd, New York, NY",
    distance: "1.2 miles away",
    rating: 4.3,
    amenities: ["Judgement Free Zone", "Pizza Monday", "Bagel Tuesday"],
    moreAmenities: 4,
    monthlyPrice: 24.99,
    annualPrice: 249.99,
    hours: "5:00 AM - 10:00 PM",
    phone: "(555) 456-7890"
  }
];

export const mockMessages = [
  {
    id: 1,
    user: {
      name: "Chris Evans",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      initials: "CE"
    },
    lastMessage: "Ready for that bench press session tomorrow?",
    timestamp: "2m ago",
    unread: true
  },
  {
    id: 2,
    user: {
      name: "Emma Stone",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b734?w=150&h=150&fit=crop&crop=face",
      initials: "ES"
    },
    lastMessage: "Thanks for the great workout tips!",
    timestamp: "1h ago",
    unread: false
  },
  {
    id: 3,
    user: {
      name: "Ryan Reynolds",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      initials: "RR"
    },
    lastMessage: "Deadpool workout was insane! 😂",
    timestamp: "3h ago",
    unread: false
  }
];