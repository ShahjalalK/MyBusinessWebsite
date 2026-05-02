export default function EmailSignaturePricingSection() {
  const plans = [
    {
      name: "Basic",
      title: "Simple Clickable Email Signature",
      price: 30,
      features: [
        "1 HTML email signature",
        "Clickable social icons",
        "Clean & responsive design",
        "Source File Included",
        "3 Revisions",
        "2 Days Delivery"
      ],
      buttonText: "Start Basic Project",
      highlight: false
    },
    {
      name: "Standard",
      title: "Custom Professional Signature",
      price: 50,
      features: [
        "1 custom branded signature",
        "Social icons + website + CTA button",
        "Gmail & Outlook compatible",
        "Design Concept Included",
        "Unlimited Revisions",
        "3 Days Delivery"
      ],
      buttonText: "Get Professional Design",
      highlight: true
    },
    {
      name: "Premium",
      title: "Business / Team Signature Pack",
      price: 100,
      features: [
        "Up to 5 signatures (Team Pack)",
        "Fully branded design",
        "Banner / promo section",
        "All email client compatible",
        "Unlimited Revisions",
        "4 Days Delivery"
      ],
      buttonText: "Hire for Your Team",
      highlight: false
    }
  ];

  return (
    <section className="py-20 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
            Email Signature Pricing Plans
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Choose the perfect plan to transform your emails into a professional marketing tool. 
            Trusted by clients for high-converting HTML designs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`relative p-8 rounded-3xl border ${
                plan.highlight 
                ? 'border-blue-500 shadow-2xl scale-105 z-10 bg-blue-50/30 dark:bg-blue-900/10' 
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  Most Popular
                </span>
              )}
              
              <div className="mb-6">
                <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{plan.name}</h3>
                <p className="text-slate-900 dark:text-white font-semibold mt-1">{plan.title}</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">${plan.price}</span>
                  <span className="ml-1 text-slate-500 text-sm">/per project</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start text-sm text-slate-600 dark:text-slate-300">
                    <svg className="w-5 h-5 text-green-500 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button className={`w-full py-4 rounded-xl font-bold transition-all duration-300 ${
                plan.highlight 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}>
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm italic">
            * Need more than 5 signatures or a custom solution? 
            <a href="/contact" className="ml-2 text-blue-600 font-bold hover:underline">Contact me for a custom quote.</a>
          </p>
        </div>
      </div>
    </section>
  );
}