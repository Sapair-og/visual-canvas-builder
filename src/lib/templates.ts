import { CanvasNode } from '../types/canvas';

export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  structure: CanvasNode;
}

export const TEMPLATES: LayoutTemplate[] = [
  {
    id: 'hero-banner',
    name: 'Hero Section',
    description: 'Headline, sub-headline, and Action button',
    structure: {
      id: 'template-hero-root-' + Math.random().toString(36).substring(2, 5),
      type: 'Container',
      props: {
        style: {
          width: '640px',
          height: '320px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: '24px',
          paddingBottom: '24px',
          paddingLeft: '32px',
          paddingRight: '32px',
          backgroundColor: '#0f172a', // slate-900
          borderRadius: '16px',
          borderColor: '#334155', // slate-700
          borderWidth: '1',
          gap: '16px'
        }
      },
      children: [
        {
          id: 'hero-title-' + Math.random().toString(36).substring(2, 5),
          type: 'TextBlock',
          props: {
            tag: 'h1',
            text: 'Empower Your Design Vision',
            style: {
              width: '100%',
              textColor: '#f8fafc', // slate-50
              textAlign: 'center'
            },
            className: 'text-3xl font-extrabold tracking-tight'
          },
          children: []
        },
        {
          id: 'hero-desc-' + Math.random().toString(36).substring(2, 5),
          type: 'TextBlock',
          props: {
            tag: 'p',
            text: 'Craft responsive visual components, edit pixel-perfect spacings, and generate production-ready code with a single click.',
            style: {
              width: '100%',
              textColor: '#94a3b8', // slate-400
              textAlign: 'center'
            },
            className: 'text-xs max-w-lg leading-relaxed'
          },
          children: []
        },
        {
          id: 'hero-btn-' + Math.random().toString(36).substring(2, 5),
          type: 'Button',
          props: {
            text: 'Start Building Free',
            linkTo: '/signup',
            style: {
              width: '180px',
              height: '40px',
              backgroundColor: '#3b82f6', // blue-500
              textColor: '#ffffff',
              borderRadius: '8px',
              paddingTop: '8px',
              paddingBottom: '8px',
              paddingLeft: '16px',
              paddingRight: '16px'
            },
            className: 'font-semibold text-xs hover:bg-blue-600 shadow-lg shadow-blue-500/10'
          },
          children: []
        }
      ]
    }
  },
  {
    id: 'pricing-grid',
    name: 'Pricing Cards',
    description: '3-Column horizontal pricing cards list',
    structure: {
      id: 'template-pricing-root-' + Math.random().toString(36).substring(2, 5),
      type: 'Container',
      props: {
        style: {
          width: '720px',
          height: '350px',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '20px',
          paddingBottom: '20px',
          paddingLeft: '20px',
          paddingRight: '20px',
          backgroundColor: '#1e293b', // slate-800
          borderRadius: '16px',
          gap: '16px'
        }
      },
      children: [
        {
          id: 'price-card-basic-' + Math.random().toString(36).substring(2, 5),
          type: 'Container',
          props: {
            style: {
              width: '200px',
              height: '280px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              paddingTop: '16px',
              paddingBottom: '16px',
              paddingLeft: '16px',
              paddingRight: '16px',
              backgroundColor: '#0f172a', // slate-900
              borderRadius: '12px'
            }
          },
          children: [
            {
              id: 'basic-lbl-' + Math.random().toString(36).substring(2, 5),
              type: 'TextBlock',
              props: {
                tag: 'h3',
                text: 'Basic Plan',
                style: { textColor: '#94a3b8', textAlign: 'center' },
                className: 'text-xs uppercase tracking-wider font-bold'
              },
              children: []
            },
            {
              id: 'basic-price-' + Math.random().toString(36).substring(2, 5),
              type: 'TextBlock',
              props: {
                tag: 'h1',
                text: '$19 / mo',
                style: { textColor: '#ffffff', textAlign: 'center' },
                className: 'text-xl font-extrabold'
              },
              children: []
            },
            {
              id: 'basic-btn-' + Math.random().toString(36).substring(2, 5),
              type: 'Button',
              props: {
                text: 'Select Basic',
                style: {
                  width: '100%',
                  height: '32px',
                  backgroundColor: '#334155',
                  textColor: '#ffffff',
                  borderRadius: '6px'
                },
                className: 'text-[10px] font-medium hover:bg-slate-700'
              },
              children: []
            }
          ]
        },
        {
          id: 'price-card-pro-' + Math.random().toString(36).substring(2, 5),
          type: 'Container',
          props: {
            style: {
              width: '210px',
              height: '300px', // slightly larger to represent "popular"
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              paddingTop: '20px',
              paddingBottom: '20px',
              paddingLeft: '16px',
              paddingRight: '16px',
              backgroundColor: '#0f172a',
              borderRadius: '12px',
              borderColor: '#3b82f6', // highlighted pro card
              borderWidth: '2'
            }
          },
          children: [
            {
              id: 'pro-lbl-' + Math.random().toString(36).substring(2, 5),
              type: 'TextBlock',
              props: {
                tag: 'h3',
                text: 'Professional Plan',
                style: { textColor: '#3b82f6', textAlign: 'center' },
                className: 'text-xs uppercase tracking-wider font-bold'
              },
              children: []
            },
            {
              id: 'pro-price-' + Math.random().toString(36).substring(2, 5),
              type: 'TextBlock',
              props: {
                tag: 'h1',
                text: '$49 / mo',
                style: { textColor: '#ffffff', textAlign: 'center' },
                className: 'text-2xl font-extrabold'
              },
              children: []
            },
            {
              id: 'pro-btn-' + Math.random().toString(36).substring(2, 5),
              type: 'Button',
              props: {
                text: 'Select Pro',
                style: {
                  width: '100%',
                  height: '36px',
                  backgroundColor: '#3b82f6',
                  textColor: '#ffffff',
                  borderRadius: '6px'
                },
                className: 'text-[10px] font-bold hover:bg-blue-600 shadow-md shadow-blue-500/10'
              },
              children: []
            }
          ]
        },
        {
          id: 'price-card-ent-' + Math.random().toString(36).substring(2, 5),
          type: 'Container',
          props: {
            style: {
              width: '200px',
              height: '280px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              paddingTop: '16px',
              paddingBottom: '16px',
              paddingLeft: '16px',
              paddingRight: '16px',
              backgroundColor: '#0f172a',
              borderRadius: '12px'
            }
          },
          children: [
            {
              id: 'ent-lbl-' + Math.random().toString(36).substring(2, 5),
              type: 'TextBlock',
              props: {
                tag: 'h3',
                text: 'Enterprise Plan',
                style: { textColor: '#94a3b8', textAlign: 'center' },
                className: 'text-xs uppercase tracking-wider font-bold'
              },
              children: []
            },
            {
              id: 'ent-price-' + Math.random().toString(36).substring(2, 5),
              type: 'TextBlock',
              props: {
                tag: 'h1',
                text: '$99 / mo',
                style: { textColor: '#ffffff', textAlign: 'center' },
                className: 'text-xl font-extrabold'
              },
              children: []
            },
            {
              id: 'ent-btn-' + Math.random().toString(36).substring(2, 5),
              type: 'Button',
              props: {
                text: 'Select Enterprise',
                style: {
                  width: '100%',
                  height: '32px',
                  backgroundColor: '#334155',
                  textColor: '#ffffff',
                  borderRadius: '6px'
                },
                className: 'text-[10px] font-medium hover:bg-slate-700'
              },
              children: []
            }
          ]
        }
      ]
    }
  },
  {
    id: 'feature-box',
    name: 'Feature Callout',
    description: 'Icon header + Image grid layout',
    structure: {
      id: 'template-feat-root-' + Math.random().toString(36).substring(2, 5),
      type: 'Container',
      props: {
        style: {
          width: '640px',
          height: '240px',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '20px',
          paddingBottom: '20px',
          paddingLeft: '24px',
          paddingRight: '24px',
          backgroundColor: '#0f172a', // slate-900
          borderRadius: '16px'
        }
      },
      children: [
        {
          id: 'feat-desc-container-' + Math.random().toString(36).substring(2, 5),
          type: 'Container',
          props: {
            style: {
              width: '320px',
              height: '180px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '12px'
            }
          },
          children: [
            {
              id: 'feat-icon-' + Math.random().toString(36).substring(2, 5),
              type: 'Icon',
              props: {
                iconName: 'Sparkles',
                style: {
                  width: '28px',
                  height: '28px',
                  textColor: '#3b82f6'
                }
              },
              children: []
            },
            {
              id: 'feat-title-' + Math.random().toString(36).substring(2, 5),
              type: 'TextBlock',
              props: {
                tag: 'h2',
                text: 'Tailwind Play Engine',
                style: { textColor: '#ffffff' },
                className: 'text-lg font-bold'
              },
              children: []
            },
            {
              id: 'feat-body-' + Math.random().toString(36).substring(2, 5),
              type: 'TextBlock',
              props: {
                tag: 'p',
                text: 'Instantly build fully responsive web containers using absolute layers and download them inside standalone index.html copies.',
                style: { textColor: '#64748b' },
                className: 'text-[10px] leading-relaxed'
              },
              children: []
            }
          ]
        },
        {
          id: 'feat-img-' + Math.random().toString(36).substring(2, 5),
          type: 'ImageBlock',
          props: {
            imageUrl: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=400&q=80',
            imageAlt: 'Dashboard mockup',
            style: {
              width: '240px',
              height: '160px',
              borderRadius: '10px'
            }
          },
          children: []
        }
      ]
    }
  },
  {
    id: 'navbar-section',
    name: 'Navbar Header',
    description: 'Site Navigation Header with branding, links, and signup button',
    structure: {
      id: 'template-nav-root-' + Math.random().toString(36).substring(2, 5),
      type: 'Container',
      props: {
        style: {
          width: '720px',
          height: '64px',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '8px',
          paddingBottom: '8px',
          paddingLeft: '24px',
          paddingRight: '24px',
          backgroundColor: '#0f172a',
          borderRadius: '12px',
          borderColor: '#1e293b',
          borderWidth: '1'
        }
      },
      children: [
        {
          id: 'nav-brand-' + Math.random().toString(36).substring(2, 5),
          type: 'TextBlock',
          props: {
            tag: 'span',
            text: '✨ WebLaunch',
            style: { textColor: '#ffffff' },
            className: 'font-extrabold text-sm'
          },
          children: []
        },
        {
          id: 'nav-links-' + Math.random().toString(36).substring(2, 5),
          type: 'Container',
          props: {
            style: {
              width: '240px',
              height: '36px',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center',
              backgroundColor: 'transparent'
            }
          },
          children: [
            {
              id: 'nav-lnk-1-' + Math.random().toString(36).substring(2, 5),
              type: 'TextBlock',
              props: {
                tag: 'span',
                text: 'Features',
                style: { textColor: '#94a3b8' },
                className: 'text-[10px] font-semibold cursor-pointer hover:text-white'
              },
              children: []
            },
            {
              id: 'nav-lnk-2-' + Math.random().toString(36).substring(2, 5),
              type: 'TextBlock',
              props: {
                tag: 'span',
                text: 'Pricing',
                style: { textColor: '#94a3b8' },
                className: 'text-[10px] font-semibold cursor-pointer hover:text-white'
              },
              children: []
            },
            {
              id: 'nav-lnk-3-' + Math.random().toString(36).substring(2, 5),
              type: 'TextBlock',
              props: {
                tag: 'span',
                text: 'Contact',
                style: { textColor: '#94a3b8' },
                className: 'text-[10px] font-semibold cursor-pointer hover:text-white'
              },
              children: []
            }
          ]
        },
        {
          id: 'nav-btn-' + Math.random().toString(36).substring(2, 5),
          type: 'Button',
          props: {
            text: 'Sign In',
            style: {
              width: '90px',
              height: '32px',
              backgroundColor: '#3b82f6',
              textColor: '#ffffff',
              borderRadius: '6px'
            },
            className: 'text-[10px] font-bold'
          },
          children: []
        }
      ]
    }
  },
  {
    id: 'gallery-section',
    name: 'Visual Gallery',
    description: '3-Column responsive image block showcases',
    structure: {
      id: 'template-gal-root-' + Math.random().toString(36).substring(2, 5),
      type: 'Container',
      props: {
        style: {
          width: '720px',
          height: '245px',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px',
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
          backgroundColor: '#090d16',
          borderRadius: '12px',
          gap: '12px'
        }
      },
      children: [
        {
          id: 'gal-img-1-' + Math.random().toString(36).substring(2, 5),
          type: 'ImageBlock',
          props: {
            imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80',
            imageAlt: 'Beach landscape',
            style: {
              width: '216px',
              height: '200px',
              borderRadius: '8px'
            }
          },
          children: []
        },
        {
          id: 'gal-img-2-' + Math.random().toString(36).substring(2, 5),
          type: 'ImageBlock',
          props: {
            imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=300&q=80',
            imageAlt: 'Mountain forest',
            style: {
              width: '216px',
              height: '200px',
              borderRadius: '8px'
            }
          },
          children: []
        },
        {
          id: 'gal-img-3-' + Math.random().toString(36).substring(2, 5),
          type: 'ImageBlock',
          props: {
            imageUrl: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=300&q=80',
            imageAlt: 'Wooden bridge',
            style: {
              width: '216px',
              height: '200px',
              borderRadius: '8px'
            }
          },
          children: []
        }
      ]
    }
  },
  {
    id: 'faq-section',
    name: 'FAQ Accordion',
    description: 'Structured Frequently Asked Questions section',
    structure: {
      id: 'template-faq-root-' + Math.random().toString(36).substring(2, 5),
      type: 'Container',
      props: {
        style: {
          width: '640px',
          height: '260px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: '20px',
          paddingBottom: '20px',
          paddingLeft: '32px',
          paddingRight: '32px',
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          gap: '12px'
        }
      },
      children: [
        {
          id: 'faq-header-' + Math.random().toString(36).substring(2, 5),
          type: 'TextBlock',
          props: {
            tag: 'h2',
            text: 'Frequently Asked Questions',
            style: { textColor: '#ffffff' },
            className: 'text-lg font-bold mb-2'
          },
          children: []
        },
        {
          id: 'faq-row-1-' + Math.random().toString(36).substring(2, 5),
          type: 'Container',
          props: {
            style: {
              width: '100%',
              height: '64px',
              display: 'flex',
              flexDirection: 'column',
              paddingTop: '8px',
              paddingBottom: '8px',
              paddingLeft: '16px',
              paddingRight: '16px',
              backgroundColor: '#1e293b',
              borderRadius: '8px',
              gap: '4px'
            }
          },
          children: [
            {
              id: 'faq-q1-' + Math.random().toString(36).substring(2, 5),
              type: 'TextBlock',
              props: {
                tag: 'p',
                text: 'How does code export work?',
                style: { textColor: '#f8fafc' },
                className: 'text-[10px] font-bold'
              },
              children: []
            },
            {
              id: 'faq-a1-' + Math.random().toString(36).substring(2, 5),
              type: 'TextBlock',
              props: {
                tag: 'p',
                text: 'Click the Export button to download compiled React/Next.js or static HTML/Tailwind templates.',
                style: { textColor: '#94a3b8' },
                className: 'text-[9px]'
              },
              children: []
            }
          ]
        },
        {
          id: 'faq-row-2-' + Math.random().toString(36).substring(2, 5),
          type: 'Container',
          props: {
            style: {
              width: '100%',
              height: '64px',
              display: 'flex',
              flexDirection: 'column',
              paddingTop: '8px',
              paddingBottom: '8px',
              paddingLeft: '16px',
              paddingRight: '16px',
              backgroundColor: '#1e293b',
              borderRadius: '8px',
              gap: '4px'
            }
          },
          children: [
            {
              id: 'faq-q2-' + Math.random().toString(36).substring(2, 5),
              type: 'TextBlock',
              props: {
                tag: 'p',
                text: 'Is there any database hosting required?',
                style: { textColor: '#f8fafc' },
                className: 'text-[10px] font-bold'
              },
              children: []
            },
            {
              id: 'faq-a2-' + Math.random().toString(36).substring(2, 5),
              type: 'TextBlock',
              props: {
                tag: 'p',
                text: 'No, this is a local-first browser client mapping configurations directly onto LocalStorage.',
                style: { textColor: '#94a3b8' },
                className: 'text-[9px]'
              },
              children: []
            }
          ]
        }
      ]
    }
  },
  {
    id: 'testimonials-section',
    name: 'Customer Testimonial',
    description: 'Social proof card containing user review feedback',
    structure: {
      id: 'template-testi-root-' + Math.random().toString(36).substring(2, 5),
      type: 'Container',
      props: {
        style: {
          width: '480px',
          height: '220px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: '24px',
          paddingBottom: '24px',
          paddingLeft: '32px',
          paddingRight: '32px',
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          borderColor: '#1e293b',
          borderWidth: '1',
          gap: '12px'
        }
      },
      children: [
        {
          id: 'testi-icon-' + Math.random().toString(36).substring(2, 5),
          type: 'Icon',
          props: {
            iconName: 'Heart',
            style: {
              width: '24px',
              height: '24px',
              textColor: '#ef4444'
            }
          },
          children: []
        },
        {
          id: 'testi-quote-' + Math.random().toString(36).substring(2, 5),
          type: 'TextBlock',
          props: {
            tag: 'p',
            text: '"Using WebLaunch completely changed how we build and launch visual landing pages. It takes seconds to compile AST nodes directly into responsive code."',
            style: { textColor: '#e2e8f0', textAlign: 'center' },
            className: 'text-xs italic leading-relaxed font-medium'
          },
          children: []
        },
        {
          id: 'testi-author-' + Math.random().toString(36).substring(2, 5),
          type: 'TextBlock',
          props: {
            tag: 'span',
            text: 'Sarah Jenkins, Product Designer',
            style: { textColor: '#3b82f6' },
            className: 'text-[10px] font-bold uppercase tracking-wider'
          },
          children: []
        }
      ]
    }
  },
  {
    id: 'contact-section',
    name: 'Contact Card',
    description: 'Responsive customer form with text fields and action button',
    structure: {
      id: 'template-cont-root-' + Math.random().toString(36).substring(2, 5),
      type: 'Container',
      props: {
        style: {
          width: '400px',
          height: '320px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingTop: '24px',
          paddingBottom: '24px',
          paddingLeft: '24px',
          paddingRight: '24px',
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          gap: '14px'
        }
      },
      children: [
        {
          id: 'cont-title-' + Math.random().toString(36).substring(2, 5),
          type: 'TextBlock',
          props: {
            tag: 'h2',
            text: 'Get In Touch',
            style: { textColor: '#ffffff' },
            className: 'text-lg font-bold'
          },
          children: []
        },
        {
          id: 'cont-email-card-' + Math.random().toString(36).substring(2, 5),
          type: 'Container',
          props: {
            style: {
              width: '100%',
              height: '40px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              paddingLeft: '12px',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              borderColor: '#334155',
              borderWidth: '1'
            }
          },
          children: [
            {
              id: 'cont-email-lbl-' + Math.random().toString(36).substring(2, 5),
              type: 'TextBlock',
              props: {
                tag: 'span',
                text: 'Email Address: enter here...',
                style: { textColor: '#64748b' },
                className: 'text-[10px]'
              },
              children: []
            }
          ]
        },
        {
          id: 'cont-msg-card-' + Math.random().toString(36).substring(2, 5),
          type: 'Container',
          props: {
            style: {
              width: '100%',
              height: '80px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              paddingTop: '8px',
              paddingLeft: '12px',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              borderColor: '#334155',
              borderWidth: '1'
            }
          },
          children: [
            {
              id: 'cont-msg-lbl-' + Math.random().toString(36).substring(2, 5),
              type: 'TextBlock',
              props: {
                tag: 'span',
                text: 'Write details of your request here...',
                style: { textColor: '#64748b' },
                className: 'text-[10px]'
              },
              children: []
            }
          ]
        },
        {
          id: 'cont-btn-' + Math.random().toString(36).substring(2, 5),
          type: 'Button',
          props: {
            text: 'Send Message',
            style: {
              width: '100%',
              height: '36px',
              backgroundColor: '#3b82f6',
              textColor: '#ffffff',
              borderRadius: '8px'
            },
            className: 'text-xs font-bold'
          },
          children: []
        }
      ]
    }
  },
  {
    id: 'footer-section',
    name: 'Sleek Footer',
    description: 'Bottom layout rule containing branding links and copyrights details',
    structure: {
      id: 'template-foot-root-' + Math.random().toString(36).substring(2, 5),
      type: 'Container',
      props: {
        style: {
          width: '720px',
          height: '60px',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: '24px',
          paddingRight: '24px',
          backgroundColor: '#0a0d16',
          borderRadius: '12px'
        }
      },
      children: [
        {
          id: 'foot-copy-' + Math.random().toString(36).substring(2, 5),
          type: 'TextBlock',
          props: {
            tag: 'span',
            text: '© 2026 WebLaunch Inc. All rights reserved.',
            style: { textColor: '#64748b' },
            className: 'text-[9px]'
          },
          children: []
        },
        {
          id: 'foot-links-' + Math.random().toString(36).substring(2, 5),
          type: 'Container',
          props: {
            style: {
              width: '140px',
              height: '30px',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'transparent'
            }
          },
          children: [
            {
              id: 'foot-lnk1-' + Math.random().toString(36).substring(2, 5),
              type: 'TextBlock',
              props: {
                tag: 'span',
                text: 'Privacy',
                style: { textColor: '#475569' },
                className: 'text-[9px] cursor-pointer hover:text-slate-350'
              },
              children: []
            },
            {
              id: 'foot-lnk2-' + Math.random().toString(36).substring(2, 5),
              type: 'TextBlock',
              props: {
                tag: 'span',
                text: 'Terms',
                style: { textColor: '#475569' },
                className: 'text-[9px] cursor-pointer hover:text-slate-350'
              },
              children: []
            }
          ]
        }
      ]
    }
  }
];
