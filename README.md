# HypIDEAS 🚀

**A Professional Social Innovation Platform**

[![React Native](https://img.shields.io/badge/React%20Native-0.72.0-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-49.0.0-000020.svg)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.38.0-green.svg)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/JavaScript-ES2022-yellow.svg)](https://www.javascript.com/)

> A complete social media platform for innovators and idea-sharing, built with React Native, Expo, and Supabase. Features real-time messaging, advanced admin controls, and professional-grade social capabilities.

## ✨ Features

### 🔐 **Authentication & User Management**
- Phone-based authentication with OTP verification
- Advanced user registration with interests selection
- Profile management with avatar upload
- Secure user sessions and data protection

### 📱 **Core Social Features**
- Real-time post creation and sharing
- Advanced commenting system with nested threading
- Multi-reaction system (👍❤️💡🔥) for posts and comments
- Professional responsive design (60/40 layout on web)
- Infinite scroll feeds with pull-to-refresh

### 💬 **Enhanced Chat System**
- Real-time private messaging
- World chat channels for community discussions
- File sharing and document upload
- Typing indicators and read receipts
- Message reactions and threading

### 👑 **Maximum Admin Powers**
- Complete administrative dashboard
- Advanced user management and moderation
- Content moderation with auto-flagging
- Platform analytics and insights
- System health monitoring
- Ban/unban users with temporary or permanent options

### 🎨 **Professional UI/UX**
- Modern, responsive design
- Dark/light mode compatibility
- Professional color schemes and typography
- Smooth animations and transitions
- Mobile-first approach with web optimization

## 🚀 **Technology Stack**

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL, Auth, Real-time, Storage)
- **Navigation**: React Navigation 6
- **State Management**: React Context API
- **Real-time**: Supabase Real-time subscriptions
- **Authentication**: Supabase Auth with phone verification
- **Database**: PostgreSQL with Row Level Security (RLS)
- **File Storage**: Supabase Storage
- **Styling**: StyleSheet with responsive design

## 📦 **Installation & Setup**

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Supabase account

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/YOUR_USERNAME/HypIDEAS.git
cd HypIDEAS
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Setup Environment Variables
Copy \`.env.example\` to \`.env\` and fill in your Supabase credentials:

\`\`\`env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### 4. Setup Supabase Database
Run the SQL scripts in \`/database\` folder in your Supabase SQL editor:
- \`01-initial-schema.sql\`
- \`02-auth-setup.sql\`
- \`03-admin-features.sql\`

### 5. Start the Development Server
\`\`\`bash
# Start Expo development server
npx expo start

# For web development
npx expo start --web

# For mobile development
npx expo start --tunnel
\`\`\`

## 📱 **Usage**

### For Regular Users
1. **Sign Up**: Use phone number for secure OTP authentication
2. **Complete Profile**: Add interests and personal information
3. **Create Posts**: Share your innovative ideas and projects
4. **Engage**: Like, comment, and react to community posts
5. **Chat**: Connect with other innovators through real-time messaging
6. **Discover**: Use advanced search to find users and content

### For Administrators
1. **Access Admin Dashboard**: Available in header for admin users
2. **User Management**: View, ban, or manage all platform users
3. **Content Moderation**: Review flagged content and take action
4. **Platform Analytics**: Monitor user growth and engagement metrics
5. **System Health**: Check real-time platform performance
6. **Announcements**: Create platform-wide notifications

## 🏗️ **Project Structure**

\`\`\`
HypIDEAS/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── chat/           # Chat and messaging components
│   │   ├── comments/       # Advanced commenting system
│   │   ├── common/         # Shared UI components
│   │   └── ui/             # Core UI elements
│   ├── constants/          # App configuration and constants
│   ├── context/            # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── navigation/         # Navigation configuration
│   ├── screens/            # Screen components
│   │   ├── auth/           # Authentication screens
│   │   ├── admin/          # Admin dashboard screens
│   │   ├── chat/           # Chat and messaging screens
│   │   ├── home/           # Main feed and home screens
│   │   └── posts/          # Post-related screens
│   ├── services/           # API and external service integrations
│   │   ├── admin/          # Admin service functions
│   │   ├── chat/           # Chat service functions
│   │   └── supabase/       # Supabase client and utilities
│   └── utils/              # Utility functions and helpers
├── assets/                 # Images, fonts, and static assets
├── database/               # SQL scripts and database schema
└── docs/                   # Documentation and guides
\`\`\`

## 🎯 **Key Highlights**

- **Professional Grade**: Built with enterprise-level architecture and security
- **Real-time Everything**: Live updates for posts, comments, chat, and admin actions
- **Maximum Admin Control**: Complete platform management capabilities
- **Mobile + Web**: Responsive design that works perfectly on all devices
- **Scalable Backend**: Powered by Supabase with PostgreSQL and real-time subscriptions
- **Modern Tech Stack**: Latest React Native, Expo, and JavaScript features

## 🔒 **Security Features**

- Row Level Security (RLS) on all database tables
- Secure phone-based authentication
- Admin role-based access control
- API rate limiting and abuse protection
- Encrypted data storage and transmission
- Comprehensive audit logging for admin actions

## 📈 **Platform Statistics** (Demo)

- **Users**: Growing community of innovators
- **Posts**: Ideas and projects shared daily
- **Real-time Features**: Live chat, notifications, and updates
- **Admin Tools**: Complete moderation and management capabilities
- **Performance**: Optimized for speed and scalability

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Supabase** for providing an excellent backend-as-a-service
- **Expo** for simplifying React Native development
- **React Native Community** for amazing packages and support

## 📞 **Contact**

- **GitHub**: [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)
- **Email**: your.email@example.com
- **Platform**: [HypIDEAS Live Demo](https://hypideas-demo.netlify.app)

---

**HypIDEAS** - Where Innovation Meets Community 🚀

Built with ❤️ using React Native, Expo & Supabase
