'use client';

import { motion } from 'framer-motion';
import { Sparkles, Camera, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';

// ─── Feature data ───────────────────────────────────────────────────────

const features = [
  {
    id: 'smart-search',
    title: 'Smart Search',
    description: 'Find parts using natural language — just describe what you need',
    icon: Sparkles,
    gradient: 'from-red-500 to-red-700',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-700',
    borderGradient: 'from-red-200 to-red-400',
    action: 'catalog' as const,
  },
  {
    id: 'image-recognition',
    title: 'Image Recognition',
    description: 'Upload a photo of any part and our AI will identify it',
    icon: Camera,
    gradient: 'from-orange-400 to-red-500',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    borderGradient: 'from-orange-200 to-red-300',
    action: 'identify' as const,
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    description: 'Chat with our AI assistant for expert guidance',
    icon: MessageCircle,
    gradient: 'from-red-600 to-red-500',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    borderGradient: 'from-red-400 to-red-200',
    action: 'chat' as const,
  },
];

// ─── Component ──────────────────────────────────────────────────────────

export default function AIFeaturesSection() {
  const { setView, setShowChat } = useAppStore();

  const handleAction = (action: 'catalog' | 'identify' | 'chat') => {
    if (action === 'chat') {
      setShowChat(true);
    } else {
      setView(action);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Powered by AI
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Find the right parts faster with our intelligent AI-powered tools
          </p>
        </div>
      </motion.div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.id}
              className="h-full"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <Card
                className="group relative h-full cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                onClick={() => handleAction(feature.action)}
              >
                {/* Gradient border effect */}
                <div
                  className={`absolute inset-0 rounded-xl bg-gradient-to-br ${feature.borderGradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  style={{ padding: '2px' }}
                >
                  <div className="h-full w-full rounded-[10px] bg-white" />
                </div>

                <CardContent className="relative flex min-h-[200px] flex-col items-center justify-between p-6 text-center">
                  {/* Gradient accent line at top */}
                  <div
                    className={`absolute left-0 right-0 top-0 h-1 rounded-t-xl bg-gradient-to-r ${feature.gradient}`}
                  />

                  <div className="flex flex-col items-center text-center">
                    {/* Icon */}
                    <motion.div
                      className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${feature.iconBg} transition-transform duration-300 group-hover:scale-110`}
                      whileHover={{ rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      <Icon className={`h-8 w-8 ${feature.iconColor}`} />
                    </motion.div>

                    {/* Title */}
                    <h3 className="mb-2 text-lg font-bold text-gray-900">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>

                    {/* Arrow indicator */}
                    <div
                      className={`mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${feature.gradient} text-white transition-transform duration-300 group-hover:translate-x-1`}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
