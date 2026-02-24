import {
  Building2,
  Lightbulb,
  ScreenShare,
  Trophy,
  User,
  User2,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';


type FeatureItem = {
  icon: LucideIcon;
  title: string;
  description: string;
  position?: 'left' | 'right';
  cornerStyle?: string;
};


const leftFeatures: FeatureItem[] = [
  {
    icon: Building2,
    title: 'Corretoras Integradas',
    description:
      'Conecte-se facilmente às principais corretoras do Brasil para operar com segurança e agilidade.',
    position: 'left',
    cornerStyle: 'bg-neutral-900 sm:translate-x-4 sm:rounded-br-[2px]',
  },
  {
    icon: User2,
    title: 'Comunidade de Traders',
    description:
      'Participe de grupos, compartilhe estratégias e aprenda com outros investidores em tempo real.',
    position: 'left',
    cornerStyle: 'bg-neutral-900 sm:-translate-x-4 sm:rounded-br-[2px]',
  },
  {
    icon: Trophy,
    title: 'Ranking e Desafios',
    description:
      'Participe de desafios semanais, suba no ranking e ganhe prêmios por sua performance.',
    position: 'left',
    cornerStyle: 'bg-neutral-900 sm:translate-x-4 sm:rounded-tr-[2px]',
  },
];

const rightFeatures: FeatureItem[] = [
  {
    icon: ScreenShare,
    title: 'Gráficos Avançados',
    description:
      'Acesse gráficos em tempo real com indicadores técnicos e ferramentas de análise profissional.',
    position: 'right',
    cornerStyle: 'bg-neutral-900 sm:-translate-x-4 sm:rounded-bl-[2px]',
  },
  {
    icon: User,
    title: 'Suporte Especializado',
    description:
      'Conte com suporte de especialistas para tirar dúvidas e potencializar seus resultados.',
    position: 'right',
    cornerStyle: 'bg-neutral-900 sm:translate-x-4 sm:rounded-bl-[2px]',
  },
  {
    icon: Lightbulb,
    title: 'Alertas Inteligentes',
    description:
      'Receba alertas personalizados sobre oportunidades de trade e movimentações do mercado.',
    position: 'right',
    cornerStyle: 'bg-neutral-900 sm:-translate-x-4 sm:rounded-tl-[2px]',
  },
];


const FeatureCard = ({ feature }: { feature: FeatureItem }) => {
  const Icon = feature.icon;

  return (
    <div>
      <div
        className={cn(
          'relative rounded-2xl px-6 pt-8 pb-6 text-sm shadow-lg overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl',
          'bg-secondary/60 ring-1 ring-border backdrop-blur-md',
          feature.cornerStyle,
        )}
      >
       
        <div className="absolute -inset-1 z-0 rounded-2xl bg-[radial-gradient(40%_20%_at_50%_0%,rgba(120,119,198,0.07),transparent_100%)] pointer-events-none"></div>
        
        <div className="relative z-10 flex items-center justify-center mb-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-background/80 ring-2 ring-primary/10 shadow-sm">
            <Icon className="h-7 w-7 text-primary" />
          </span>
        </div>
        <h2 className="text-foreground mb-2.5 text-xl font-semibold text-center z-10 relative">
          {feature.title}
        </h2>
        <p className="text-muted-foreground text-base text-pretty text-center z-10 relative">
          {feature.description}
        </p>
        {/* Linha decorativa sutil */}
        <span className="absolute left-1/2 -bottom-2 h-0.5 w-1/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full opacity-60"></span>
      </div>
    </div>
  );
};

export default function Feature3() {
  return (
    <section
      className="relative pt-24 pb-16 bg-background"
      id="features"
    >
      <div className="relative z-10 mx-6 max-w-[1120px] pt-2 pb-8 max-[300px]:mx-4 min-[1150px]:mx-auto">
        <div className="flex flex-col-reverse gap-8 md:grid md:grid-cols-3">
         
          <div className="flex flex-col gap-8">
            {leftFeatures.map((feature, index) => (
              <FeatureCard key={`left-feature-${index}`} feature={feature} />
            ))}
          </div>

        
          <div className="order-[1] mb-8 self-center sm:order-[0] md:mb-0 flex flex-col items-center justify-center">
            <div className="relative mx-auto mb-6 w-fit rounded-full bg-neutral-900 px-6 py-2 text-base font-medium text-foreground shadow ring-1 ring-border backdrop-blur">
              <span className="relative z-1 flex items-center gap-2 tracking-wide uppercase font-semibold text-primary">
                Funcionalidades
              </span>
              <span className="absolute -bottom-px left-1/2 h-px w-2/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></span>
            </div>
            <h2 className="text-foreground mb-3 text-center text-3xl font-bold tracking-tight sm:mb-3.5 md:text-4xl">
              O melhor da tecnologia para traders
            </h2>
            <p className="text-muted-foreground mx-auto max-w-[22rem] text-center text-lg text-pretty">
              Potencialize seus resultados com recursos avançados, comunidade ativa e suporte dedicado.
            </p>
          </div>

          
          <div className="flex flex-col gap-8">
            {rightFeatures.map((feature, index) => (
              <FeatureCard key={`right-feature-${index}`} feature={feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
