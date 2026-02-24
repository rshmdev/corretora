'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { MinusIcon, PlusIcon } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'geral' | 'planos' | 'tecnico' | 'suporte';
}

const faqItems: FaqItem[] = [
  {
    id: '1',
    question: 'O que é a plataforma de trading?',
    answer:
      'Nossa plataforma de trading é uma solução completa para operar no mercado financeiro, oferecendo ferramentas avançadas, gráficos em tempo real e recursos de automação para potencializar seus resultados.',
    category: 'geral',
  },
  {
    id: '2',
    question: 'Preciso pagar para usar a plataforma?',
    answer:
      'Oferecemos um plano gratuito com recursos essenciais e planos pagos para quem deseja funcionalidades avançadas, como robôs de trading, relatórios detalhados e suporte prioritário.',
    category: 'planos',
  },
  {
    id: '3',
    question: 'Consigo operar em quais mercados?',
    answer:
      'Você pode operar em diversos mercados, incluindo ações, forex, criptomoedas e futuros, tudo em um só lugar e com integração direta às principais corretoras.',
    category: 'geral',
  },
  {
    id: '4',
    question: 'Preciso instalar algum programa?',
    answer:
      'Não! Nossa plataforma é 100% online e pode ser acessada de qualquer dispositivo com internet, sem necessidade de instalação.',
    category: 'tecnico',
  },
  {
    id: '5',
    question: 'Posso automatizar minhas operações?',
    answer:
      'Sim, você pode criar e configurar robôs de trading personalizados, além de utilizar estratégias prontas para automatizar suas operações de acordo com seu perfil.',
    category: 'tecnico',
  },
  {
    id: '6',
    question: 'A plataforma funciona em modo escuro?',
    answer:
      'Sim, oferecemos suporte completo ao modo escuro para maior conforto visual durante suas operações.',
    category: 'tecnico',
  },
  {
    id: '7',
    question: 'Como funciona o suporte?',
    answer:
      'Nosso time de suporte está disponível via chat, e-mail e WhatsApp para tirar dúvidas, resolver problemas e ajudar você a tirar o máximo proveito da plataforma.',
    category: 'suporte',
  },
  {
    id: '8',
    question: 'Posso testar antes de contratar um plano?',
    answer:
      'Sim! Você pode criar uma conta gratuita e experimentar a plataforma sem compromisso. Assim, você conhece todos os recursos antes de decidir.',
    category: 'planos',
  },
];

const categories = [
  { id: 'all', label: 'Todos' },
  { id: 'geral', label: 'Geral' },
  { id: 'tecnico', label: 'Técnico' },
  { id: 'planos', label: 'Planos' },
  { id: 'suporte', label: 'Suporte' },
];

export default function Faq2() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFaqs =
    activeCategory === 'all'
      ? faqItems
      : faqItems.filter((item) => item.category === activeCategory);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section className="bg-background py-16">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-12 flex flex-col items-center">
          <Badge
            variant="outline"
            className="border-primary mb-4 px-3 py-1 text-xs font-medium tracking-wider uppercase"
          >
            Dúvidas Frequentes
          </Badge>

          <h2 className="text-foreground mb-6 text-center text-4xl font-bold tracking-tight md:text-5xl">
            Perguntas frequentes sobre a plataforma de trading
          </h2>

          <p className="text-muted-foreground max-w-2xl text-center">
            Encontre respostas para as principais dúvidas sobre como usar nossa plataforma de trading, planos, recursos técnicos e suporte.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-all',
                activeCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

       
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <AnimatePresence>
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={cn(
                  'border-border h-fit overflow-hidden rounded-xl border',
                  expandedId === faq.id
                    ? 'shadow-3xl bg-card/50'
                    : 'bg-card/50',
                )}
                style={{ minHeight: '88px' }}
              >
                <button
                  onClick={() => toggleExpand(faq.id)}
                  className="flex w-full items-center justify-between p-6 text-left"
                >
                  <h3 className="text-foreground text-lg font-medium">
                    {faq.question}
                  </h3>
                  <div className="ml-4 flex-shrink-0">
                    {expandedId === faq.id ? (
                      <MinusIcon className="text-primary h-5 w-5" />
                    ) : (
                      <PlusIcon className="text-primary h-5 w-5" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {expandedId === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="border-border border-t px-6 pt-2 pb-6">
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

       
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground mb-4">
            Não encontrou o que procurava?
          </p>
          <a
            href="#"
            className="border-primary text-foreground hover:bg-primary hover:text-primary-foreground inline-flex items-center justify-center rounded-lg border-2 px-6 py-3 font-medium transition-colors"
          >
            Fale com o Suporte
          </a>
        </motion.div>
      </div>
    </section>
  );
}
