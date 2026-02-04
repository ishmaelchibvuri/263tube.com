# **Strategic Revitalization of QuickBudget SA: A Comprehensive Framework for UI/UX Modernization and Intelligent Debt Remediation**

## **Executive Summary**

The South African financial technology landscape represents a unique intersection of advanced banking infrastructure and a user base characterized by profound skepticism towards digital intangibility. For QuickBudget SA, a Personal Finance Management (PFM) application operating within this duality, the imperative is no longer merely to visualize expenditure but to actively intervene in financial health. The user query—to enhance the UI/UX using Next.js and DynamoDB while implementing a sophisticated "Upsell Trigger" for Debt Payoff SA—necessitates a fundamental reimagining of the application’s role. It must evolve from a passive ledger into a proactive, algorithmic guardian.

This comprehensive report details a strategic roadmap for this transformation. It argues that success lies not in aggressive sales tactics, but in the construction of a "Trust Stack"—a user interface designed to mimic the tangibility of cash, supported by a backend architecture that identifies debt distress with clinical precision. By leveraging the time-series capabilities of DynamoDB to calculate "Debt Velocity" and employing Next.js for a high-performance, accessible frontend, QuickBudget SA can funnel high-intent leads to Debt Payoff SA. This process must be governed by a rigorous adherence to the National Credit Act (NCA) and the Protection of Personal Information Act (POPIA), ensuring that the upsell is perceived not as predatory, but as a critical lifeline.

## ---

**Part I: The Anthropological Context of South African Fintech**

### **1.1 The Paradox of Access and Distrust**

To architect a user interface that successfully converts distressed users into debt counselling candidates, one must first dissect the psychological terrain of the South African financial consumer. The market presents a stark paradox: while institutional access is high—approximately 84% of the population possesses a formal bank account—usage patterns reveal a deep-seated distrust of digital storage mechanisms.1 This is evidenced by the behavior of social grant recipients, 76% of whom withdraw their entire benefit in cash immediately upon deposit.

This behavior is not merely a preference for liquidity; it is a defense mechanism against the "invisibility" of digital finance. In the minds of many mass-market users (LSM 4-7), money left in a digital account is vulnerable to unauthorized debit orders, "system errors," and opaque bank fees. It is perceived as being outside the user's control. Conversely, cash is tangible, finite, and visually verifiable.

For QuickBudget SA, this implies that the current UI—likely modeled on minimalist Western design trends—may be actively alienating its core demographic. A minimalist interface that hides complexity also hides "truth." To funnel users effectively to Debt Payoff SA, the application must bridge the "Trust Gap." It must render digital transactions with the same visceral reality as physical cash. The UI strategy must pivot from abstraction to **Digital Skeuomorphism**, where transactions are presented as "receipts," and debt reduction is visualized not just as a changing number, but as a tangible burden being lifted.

### **1.2 The "Sandton" Bias in Design**

A critical failure mode in South African fintech is the "Sandton Bias"—the tendency to design products that reflect the lifestyle and connectivity of the corporate elite while targeting the emerging middle class.1 When an application utilizes imagery of glass-walled offices, stock photos of high-net-worth individuals, or assumes high-speed fiber connectivity, it signals to the township or rural user: "This is not for you."

If QuickBudget SA is to successfully upsell debt remediation services, the visual language must be rooted in the reality of the user. Trust is designed, not assumed.1 The imagery associated with Debt Payoff SA must reflect achievable goals within the user's context—renovating a family home in Soweto, purchasing a delivery vehicle for a side hustle, or clearing school fees. If the visual cues align with the user's aspirations rather than the designer's assumptions, the conversion rate for the upsell trigger will increase significantly.

### **1.3 The Device and Data Divide**

The technical architecture of the UI must be dictated by the hardware constraints of the target market. The "Next Billion" users in South Africa predominantly access the internet via low-to-mid-range Android devices.1 These devices often have limited processing power (RAM), storage, and battery life. Furthermore, the high cost of mobile data makes "app heaviness" a barrier to entry.

A React/Next.js application that is not aggressively optimized can easily become unusable on these devices. Heavy JavaScript bundles, auto-playing videos, and unoptimized high-resolution images can lead to slow load times and high data consumption, which users equate with "airtime theft." The "Upsell Trigger" cannot be a bandwidth-heavy modal window or a video explainer; it must be a lightweight, text-first intervention that loads instantly. The UI must adopt a "Data Saver" mode by default, prioritizing core financial data over decorative elements.

**Table 1: User Persona Constraints and UI Implications**

| Constraint | User Reality | UI Design Implication |
| :---- | :---- | :---- |
| **Connectivity** | Intermittent 3G/4G, frequent load shedding. | Offline-first architecture (Service Workers); Optimistic UI updates. |
| **Device Power** | 2GB RAM Android devices common. | Minimize JS main thread work; use CSS animations over JS; code-split heavy routes. |
| **Data Cost** | Prepaid data is expensive per MB. | "Data Saver" toggle; SVG vector graphics over raster images; lazy-load non-critical components. |
| **Visual Literacy** | Varying levels of digital literacy; multilingual. | Icon-heavy navigation; localized copy (IsiZulu, Sesotho); high-contrast typography. |

## ---

**Part II: Trust-Based UI Architecture with Next.js**

### **2.1 The "Trust Stack" Design System**

To combat the inherent skepticism towards digital finance, QuickBudget SA requires a bespoke design system—the "Trust Stack." This system prioritizes clarity, stability, and transparency over aesthetic minimalism.

#### **2.1.1 Color Psychology and Status Indication**

Financial dashboards often rely on a binary "Red/Green" color scheme. However, in the context of debt management, excessive use of red can induce anxiety and avoidance behavior ("The Ostrich Effect"). The Trust Stack shifts the palette towards **Stability and Caution**.

* **Blue as the Anchor:** As supported by design research, blue represents stability and "normal" operational states.2 The primary navigation, safe balances, and verified transactions should utilize deep, trustworthy blues to anchor the user's emotional state.  
* **The Amber Warning:** Instead of immediately flagging high debt with red, the system should use the "Caution" spectrum (Amber/Orange). This signals that a threshold has been breached but recovery is possible.2 The "Upsell Trigger" for Debt Payoff SA should primarily live in this amber zone—positioning the service as a corrective tool rather than a penalty for failure.  
* **Green for Reinforcement:** Green should be reserved for positive reinforcement—successful logins, budget adherence, and payment confirmations. This builds a reservoir of positive sentiment that can be tapped when the user needs to be confronted with the difficult reality of their debt.

#### **2.1.2 Typography and Readability**

South Africa has 11 official languages and a diverse range of literacy levels. The typography must be robust enough to handle varying word lengths across languages without breaking the layout.

* **Font Selection:** A variable font like *Inter* or *Roboto* is recommended for its high legibility on low-resolution screens.  
* **Plain Language:** The UI copy must strip away banking jargon. Terms like "Amortization" and "Debit Order" should be replaced or augmented with conversational equivalents like "Pay-off Plan" and "Automatic Monthly Payment".3 The "Upsell Trigger" must speak the user's language—literally and figuratively.

### **2.2 The "Financial Health Monitor" Dashboard**

The dashboard is the primary interface for the "Upsell Trigger." It must evolve from a static list of transactions to a dynamic "Health Monitor" that visualizes the trajectory of the user's finances.

#### **2.2.1 Sparklines for Trend Visualization**

A static debt figure (e.g., "-R15,000") provides no context. Is the debt increasing or decreasing? To facilitate the upsell, the user must see the *trend*. We will implement **React Sparklines** 4—miniature, inline charts that sit next to account balances.

* **Technical Implementation:** Using recharts or visx within Next.js, these sparklines will render lightweight SVG paths.  
* **The Narrative:** An upward-trending red sparkline next to a credit card balance is a pre-attentive visual attribute. The user processes the "danger" instantly, creating a micro-moment of realization that primes them for the Debt Payoff SA intervention.

#### **2.2.2 Skeuomorphic Trust Signals**

To bridge the gap between digital and physical, specific interaction points should use skeuomorphic elements.

* **The Digital Receipt:** When a user logs a cash expense or pays a bill, the UI should generate a "digital receipt" animation. This provides the visual closure associated with a physical transaction.1  
* **The "Verified" Badge:** Transactions imported from bank feeds should carry a "Verified by Bank" shield icon. This reinforces that QuickBudget SA is a window into the "real" banking system, not a separate, untrusted entity.

### **2.3 Next.js Performance Optimization for the SA Market**

The technical implementation of the UI must align with the device constraints identified in Part I.

#### **2.3.1 Server-Side Rendering (SSR) vs. Static Generation (SSG)**

For a PFM app, data freshness is critical. However, full SSR can be slow on high-latency networks.

* **Hybrid Approach:** We will use **Incremental Static Regeneration (ISR)** for the application shell and static marketing pages (including the Debt Payoff SA landing page).  
* **Client-Side Hydration:** The dashboard data (balances, transactions) will be fetched client-side using **SWR (Stale-While-Revalidate)**.6 This pattern allows the app to show cached data instantly (even offline), fulfilling the user's need for immediate access, while revalidating the data in the background.

#### **2.3.2 Code Splitting and Dynamic Imports**

To keep the initial bundle size low, heavy components like the "Debt Projection Chart" or the "Upsell Form" must be dynamically imported.

* **Lazy Loading:** The "Debt Payoff" modal should only load its JavaScript payload when the user actually clicks the trigger button. This ensures that the core budgeting features remain fast and responsive for the 90% of users who may not need debt counseling immediately.

## ---

**Part III: The Algorithmic Core \- DynamoDB & Debt Intelligence**

The "Upsell Trigger" is not merely a UI component; it is the output of a sophisticated backend logic. Randomly asking users to consolidate debt is spam; asking them when they are statistically likely to default is a service. This requires a robust time-series data architecture on Amazon DynamoDB.

### **3.1 DynamoDB Schema Design for Financial Time-Series**

DynamoDB is a key-value store, and its performance depends entirely on access patterns. We must avoid "Scan" operations, which are costly and slow. We will employ a **Single Table Design** optimized for retrieving time-series financial data.7

#### **3.1.1 Primary Key Structure**

To efficiently query a user's transaction history and aggregate debt trends, we will use a hierarchical key structure.

* **Partition Key (PK):** USER\#{UserId}  
* **Sort Key (SK):** TYPE\#{DateISO}\#{UniqueId}

**Table 2: DynamoDB Entity Definitions**

| Entity | PK Pattern | SK Pattern | Attributes | Access Pattern |
| :---- | :---- | :---- | :---- | :---- |
| **Transaction** | USER\#123 | TXN\#2026-01-23\#uuid | Amount, Category, Merchant, Balance | Fetch history by date range (begins\_with) |
| **Monthly Summary** | USER\#123 | SUMMARY\#2026-01 | TotalIncome, TotalDebt, DTI\_Ratio, DebtVelocity | Dashboard Overview |
| **User Profile** | USER\#123 | PROFILE | Name, Email, UpsellStatus, RiskScore | User Authentication & State |
| **Debt Alert** | USER\#123 | ALERT\#2026-01-23 | Severity, Message, ReadStatus | Notification Feed |

#### **3.1.2 Time-Series Query Optimization**

To render the sparklines and calculate debt trends, the application needs to fetch the last 3-6 months of data efficiently.

* **Query Strategy:** We will use the Query API with the begins\_with operator on the Sort Key. For example, begins\_with(SK, "SUMMARY\#2025") will fetch all monthly summaries for the year 2025 in a single request.8  
* **Write Sharding (Consideration):** While individual user partitions are unlikely to exceed 1000 WCUs (Write Capacity Units), the system must handle the "Payday Spike" (25th of the month). DynamoDB's adaptive capacity usually handles this, but if the app scales to millions of users, we may need to introduce a randomized suffix to the PK for global analytics queries.9

### **3.2 The "Debt Velocity" Algorithm**

The core of the "Advanced Upsell Logic" is the distinction between *static* debt and *accelerating* debt. A user with high but stable debt is a different risk profile than a user with moderate but rapidly increasing debt.

#### **3.2.1 Defining the Metrics**

* **Static DTI (Debt-to-Income):**  
  ![][image1]  
  * *Benchmark:* \< 36% (Healthy), 36-50% (Warning), \> 50% (Critical).10  
* **Debt Velocity (![][image2]):**  
  ![][image3]  
  * *Logic:* A positive velocity ![][image4] indicates the user is funding their lifestyle through credit.  
* **Distress Events:**  
  * Keywords in transaction descriptions: "Dishonour", "Insufficient Funds", "Arrears", "Handover".  
  * *Logic:* A single occurrence of these keywords is a high-confidence indicator of financial distress.

#### **3.2.2 The Lambda "Risk Engine"**

We will implement a backend process using **DynamoDB Streams** and **AWS Lambda** to calculate these metrics in near real-time without impacting frontend performance.

1. **Trigger:** User adds a transaction or a bank feed syncs new data.  
2. **Stream Event:** The INSERT event is captured by the DebtAnalyzer Lambda.  
3. **Processing:**  
   * The Lambda queries the user's SUMMARY items for the last 3 months.  
   * It recalculates the moving average of debt.  
   * It scans the new transactions for "Distress Keywords."  
4. **Action:**  
   * If DTI \> 40% OR Velocity \> 15%, the Lambda updates the PROFILE item, setting UpsellStatus to TARGET.  
   * This state change is pushed to the frontend via a subscription or picked up on the next SWR revalidation.

## ---

**Part IV: The Psychology of the Upsell Trigger**

The transition from a budgeting app to a debt consolidation service is a delicate moment. It involves moving from "Observation" to "Intervention." The logic must determine not just *who* to target, but *how* to frame the offer to maximize conversion and trust.

### **4.1 The Behavioral Funnel: Awareness, Anxiety, and Relief**

The upsell logic should not be binary (Show/Hide). It should follow a "Graduated Intervention" model, escalating based on the severity of the user's financial health.

#### **Level 1: The "Soft Nudge" (Educational)**

* **Trigger:** DTI reaches 35-40% (The "Warning Zone").  
* **UI Component:** A content card in the "Insights" tab.  
* **Copy Strategy:** "Did you know? Lowering your credit usage to 30% can boost your credit score. Here are 3 tips."  
* **Psychology:** This builds authority. The app is providing value without asking for anything. It positions QuickBudget SA as a knowledgeable partner.

#### **Level 2: The "Contextual Alert" (The "Amber" State)**

* **Trigger:** Debt Velocity spikes \> 10% or DTI reaches 40-50%.  
* **UI Component:** An inline "Toast" notification or a dashboard widget highlighted in Amber.  
* **Copy Strategy:** "You spent R1,500 on interest fees this month. That’s 10% of your income. We can help you reduce this."  
* **Psychology:** Loss Aversion. By quantifying the *cost* of the debt (R1,500), the app makes the pain tangible. The solution (Debt Payoff SA) is presented as a way to stop the pain.

#### **Level 3: The "Critical Intervention" (The "Red" State)**

* **Trigger:** DTI \> 50% or a "Dishonored Payment" event is detected.  
* **UI Component:** A prominent, dismissible modal or a persistent "Financial Health Warning" banner.  
* **Copy Strategy:** "Warning: Your debt levels are critical. This puts you at risk of legal action. Speak to a registered Debt Counsellor today for a free assessment."  
* **Psychology:** Fear and Relief. The warning induces necessary anxiety about the consequences (legal action), while the "Free Assessment" offers an immediate, low-risk path to relief.11

### **4.2 Copywriting for the South African Context**

The language used in these triggers is as important as the logic.

* **Avoid:** "Consolidate your debt." (Too technical).  
* **Use:** "Combine your payments into one." (Simple, actionable).  
* **Avoid:** "Insolvency." (Scary, legalistic).  
* **Use:** "Fresh Start." (Aspirational).  
* **Multilingual Support:** The upsell triggers should be localized. "Siza ngezikweletu" (Help with debts) carries a different emotional weight in Zulu than the English equivalent.

## ---

**Part V: Regulatory Compliance and Ethical Considerations**

In South Africa, the line between "financial information" and "financial advice" is strictly regulated by the **Financial Advisory and Intermediary Services (FAIS) Act**. Furthermore, the **National Credit Act (NCA)** governs how debt counseling is marketed and executed. QuickBudget SA must navigate this landscape carefully to avoid regulatory penalties.

### **5.1 The "Fact vs. Advice" Boundary**

QuickBudget SA is a technology platform, not a registered Financial Services Provider (FSP). Therefore, the "Upsell Trigger" must be framed as a referral, not advice.12

* **Permissible:** "Based on your transaction history, your Debt-to-Income ratio is 45%. This is higher than the recommended 36%." (Statement of Fact).  
* **Prohibited:** "You should stop paying your credit card and join Debt Review." (Specific Advice).

**Compliance Requirement:** Every upsell card must carry a clear disclaimer: *"QuickBudget SA provides data visualization tools. We do not provide financial advice. Debt counseling services are provided by Debt Payoff SA, an NCR-registered Debt Counsellor (NCRDCxxx)."*.13

### **5.2 POPIA and Data Privacy**

The **Protection of Personal Information Act (POPIA)** places strict limits on how user data can be shared with third parties (like Debt Payoff SA).

* **Explicit Consent:** The app cannot automatically send user data to Debt Payoff SA. The conversion flow must include a "Data Handshake."  
* **The "Consent Modal":** When a user clicks "Get Help," a modal must appear listing exactly what data will be shared: "By continuing, you agree to share your Name, Contact Number, and Total Debt Balance with Debt Payoff SA for the purpose of a free assessment."  
* **Audit Trail:** This consent must be logged in DynamoDB (CONSENT\#Date) to provide a legal audit trail in case of a dispute.13

### **5.3 Responsible Marketing (NCA)**

The NCA prohibits "negative option marketing" (opting users in by default) and misleading promises.

* **Truth in Advertising:** The upsell cannot promise "Write off 100% of your debt." It must use compliant language like "Reduce your monthly installments by up to X% subject to assessment."  
* **Reckless Lending Checks:** Debt Payoff SA will require data on *when* loans were taken. If the app detects loans taken without affordability checks (inferred from the user's history), this data—if shared with consent—can help the Debt Counsellor identify "Reckless Lending," a key defense under the NCA.12

## ---

**Part VI: Technical Implementation Roadmap**

### **6.1 Phase 1: The Trust Foundation (UI Overhaul)**

* **Audit:** Review existing Next.js codebase for accessibility violations and performance bottlenecks.  
* **Design System:** Implement the "Trust Stack" (Blue/Amber palette, Inter font, Skeleton screens).  
* **Component Build:** Develop the Sparkline, TrustBadge, and ReceiptAnimation components.

### **6.2 Phase 2: The Intelligence Engine (Backend)**

* **DynamoDB Migration:** Migrate to the Single Table Design schema if not already implemented.  
* **Lambda Development:** Build the DebtAnalyzer Lambda function triggered by DynamoDB Streams.  
* **Algorithm Tuning:** Backtest the "Debt Velocity" algorithm against anonymized user data to calibrate the triggers (minimizing false positives).

### **6.3 Phase 3: The Integration (Upsell Logic)**

* **Frontend Integration:** Connect the "Trigger State" from the backend to the UI components.  
* **Regulatory Compliance:** Implement the POPIA consent flow and disclaimer components.  
* **Partner API:** Build the secure API integration to push qualified leads to Debt Payoff SA's CRM.

## ---

**Conclusion**

The enhancement of QuickBudget SA represents a pivotal shift in how South African fintechs address the crisis of over-indebtedness. By combining a "Trust-First" UI design that respects the user's need for tangibility with an "Algorithmic Guardian" backend that identifies distress early, the application can serve a dual purpose: essentially managing the user's day-to-day finances while providing a safety net for their future.

The "Upsell Trigger" logic, when executed with the mathematical precision of DynamoDB's time-series analysis and the ethical constraints of the NCA, transforms a potential annoyance into a vital service. It acknowledges the reality of the South African user—financially active but vulnerable, tech-savvy but data-constrained—and offers a solution that is transparent, accessible, and deeply empathetic to their context. This strategy does not just build a better app; it builds a bridge to financial recovery.

## ---

**Detailed Technical Specifications**

### **Appendix A: DynamoDB Access Patterns & Query Logic**

To ensure the "Upsell Trigger" loads instantly, we must optimize the DynamoDB access patterns. The following table details the specific queries required for the "Financial Health Monitor."

**Table 3: Optimized DynamoDB Access Patterns**

| Requirement | Query Type | Partition Key | Sort Key Condition | Filter Expression | Rationale |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **Load Dashboard Sparkline** | Query | USER\#{ID} | begins\_with(SK, "SUMMARY\#") | Date \> {Today \- 6 Months} | Retrieves only the summary data needed for the chart, minimizing Read Capacity Units (RCU). |
| **Check Active Triggers** | GetItem | USER\#{ID} | PROFILE | N/A | Fetches the user's current risk state (UpsellStatus) in a single, low-latency read (Point Get). |
| **Analyze Recent Transactions** | Query | USER\#{ID} | begins\_with(SK, "TXN\#") | Date \> {Today \- 30 Days} | Fetches strictly the last month's data for the "Velocity" calculation Lambda. |
| **Log POPIA Consent** | PutItem | USER\#{ID} | CONSENT\#{Date} | N/A | Writes an immutable record of the user's agreement to share data. |

### **Appendix B: Next.js Component Structure for the Upsell Card**

The UpsellCard is a critical conversion component. It must be flexible enough to handle the three levels of intervention defined in Part IV.

JavaScript

// components/UpsellCard.js  
import React, { useState } from 'react';  
import { ShieldCheckIcon, ExclamationIcon } from '@heroicons/react/solid';  
import { motion, AnimatePresence } from 'framer-motion';

const UpsellCard \= ({ riskLevel, debtVelocity, onConverge }) \=\> {  
  // riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'  
    
  const content \= {  
    LOW: {  
      color: 'bg-blue-50 border-blue-200',  
      icon: \<ShieldCheckIcon className\="h-6 w-6 text-blue-500" /\>,  
      title: "Keep your financial health strong",  
      body: "Did you know keeping your credit utilization under 30% improves your score?",  
      action: "Learn More"  
    },  
    MEDIUM: {  
      color: 'bg-amber-50 border-amber-200',  
      icon: \<ExclamationIcon className\="h-6 w-6 text-amber-500" /\>,  
      title: "Your interest costs are rising",  
      body: \`You're paying ${debtVelocity}% more on debt this month. Let's look at options to reduce this.\`,  
      action: "See Savings Options"  
    },  
    HIGH: {  
      color: 'bg-red-50 border-red-200',  
      icon: \<ExclamationIcon className\="h-6 w-6 text-red-600" /\>,  
      title: "Critical: Debt Alert",  
      body: "Your debt profile suggests you may be over-indebted. Protect your assets with a free assessment.",  
      action: "Get Help Now"  
    }  
  };

  const current \= content\[riskLevel\];

  return (  
    \<AnimatePresence\>  
      \<motion.div   
        initial\={{ opacity: 0, y: 20 }}  
        animate\={{ opacity: 1, y: 0 }}  
        className\={\`rounded-lg border-l-4 p-4 shadow-sm ${current.color} mb-4\`}  
      \>  
        \<div className\="flex items-start"\>  
          \<div className\="flex-shrink-0"\>  
            {current.icon}  
          \</div\>  
          \<div className\="ml-3 w-0 flex-1 pt-0.5"\>  
            \<h3 className\="text-sm font-medium text-gray-900"\>  
              {current.title}  
            \</h3\>  
            \<p className\="mt-1 text-sm text-gray-500"\>  
              {current.body}  
            \</p\>  
            \<div className\="mt-4 flex"\>  
              \<button  
                type\="button"  
                onClick\={onConverge}  
                className\="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"  
              \>  
                {current.action}  
              \</button\>  
              {/\* Mandatory Regulatory Disclaimer \*/}  
              \<p className\="ml-4 text-xs text-gray-400 self-center"\>  
                Service provided by Debt Payoff SA (NCRDCxxx).  
              \</p\>  
            \</div\>  
          \</div\>  
        \</div\>  
      \</motion.div\>  
    \</AnimatePresence\>  
  );  
};

export default UpsellCard;

This component demonstrates the implementation of the "Trust Stack" principles:

1. **Contextual Styling:** The color shifts based on the risk level (Blue \-\> Amber \-\> Red).  
2. **Clear Typography:** Uses standard Tailwind utility classes for hierarchy.  
3. **Regulatory Compliance:** Includes the static disclaimer text within the component itself, ensuring it cannot be omitted by accident.  
4. **Performance:** Uses framer-motion for smooth entrance animations, which are more performant than heavy CSS transitions on low-end devices.

#### **Works cited**

1. Designing Fintech for the Unbanked in South Africa. | by Shingi Nhari | Nov, 2025 | Medium, accessed January 23, 2026, [https://medium.com/@shingi.nharig/designing-fintech-for-the-unbanked-in-south-africa-0bc7188a78dd](https://medium.com/@shingi.nharig/designing-fintech-for-the-unbanked-in-south-africa-0bc7188a78dd)  
2. Status indicators \- Carbon Design System, accessed January 23, 2026, [https://carbondesignsystem.com/patterns/status-indicator-pattern/](https://carbondesignsystem.com/patterns/status-indicator-pattern/)  
3. How user-centric design will shape South Africa's digital payments future \- Ozow, accessed January 23, 2026, [https://ozow.com/blog/designing-for-trust-how-user-centric-design-will-shape-south-africas-digital-payments-future](https://ozow.com/blog/designing-for-trust-how-user-centric-design-will-shape-south-africas-digital-payments-future)  
4. React Table Block Sparkline Charts \- shadcn.io, accessed January 23, 2026, [https://www.shadcn.io/blocks/tables-sparkline](https://www.shadcn.io/blocks/tables-sparkline)  
5. React Sparkline chart \- MUI X, accessed January 23, 2026, [https://mui.com/x/react-charts/sparkline/](https://mui.com/x/react-charts/sparkline/)  
6. React Dashboards \- Open-Source and Free | Admin-Dashboards.com \- GitHub, accessed January 23, 2026, [https://github.com/admin-dashboards/react-dashboards](https://github.com/admin-dashboards/react-dashboards)  
7. Top Use Cases for DynamoDB in 2024 \- Tinybird, accessed January 23, 2026, [https://www.tinybird.co/blog/dynamodb-use-cases](https://www.tinybird.co/blog/dynamodb-use-cases)  
8. Designing Time-Series Data In DynamoDB \- DEV Community, accessed January 23, 2026, [https://dev.to/urielbitton/designing-time-series-data-in-dynamodb-kcj](https://dev.to/urielbitton/designing-time-series-data-in-dynamodb-kcj)  
9. Design patterns for high-volume, time-series data in Amazon DynamoDB \- AWS, accessed January 23, 2026, [https://aws.amazon.com/blogs/database/design-patterns-for-high-volume-time-series-data-in-amazon-dynamodb/](https://aws.amazon.com/blogs/database/design-patterns-for-high-volume-time-series-data-in-amazon-dynamodb/)  
10. Understanding a healthy debt-to-income ratio \- Nedbank, accessed January 23, 2026, [https://personal.nedbank.co.za/learn/blog/healthy-debt-to-income-ratio.html](https://personal.nedbank.co.za/learn/blog/healthy-debt-to-income-ratio.html)  
11. How Fintech Tools Help You Stay Out of Debt \- BillCut, accessed January 23, 2026, [https://www.billcut.com/blogs/how-fintech-tools-help-you-stay-out-of-debt/](https://www.billcut.com/blogs/how-fintech-tools-help-you-stay-out-of-debt/)  
12. National Credit Act \- The Banking Association South Africa, accessed January 23, 2026, [https://www.banking.org.za/consumer-information/consumer-information-legislation/national-credit-act/](https://www.banking.org.za/consumer-information/consumer-information-legislation/national-credit-act/)  
13. Legal Disclaimer | The National Debt Review Center, accessed January 23, 2026, [https://www.ndrc.org.za/disclaimer](https://www.ndrc.org.za/disclaimer)

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAUCAYAAAC9BQwsAAAAzElEQVR4Xt3RMQuBQRgH8EcoAxkoBpMyGGWRGWWQkrIog4HsBjvFV7DIJ/ARGAwGH8r/cf+ru5d3uY1//ZbnfZ67e+9EfioNmNMYBqwX6ABHaLPuZUHn6AdkJTFDGt1F3SDLWp30FLEJHmzSHYqQhiXlnb6PVOkBFehCi2xSMKSeLZboCX0xOyXIzYQ6thA8qBeirnARc1w3ZZjCifS33rGra1FXdKOLbMUM7ynjdSA5SEZq+kwjMU+zJr11L8GD36JPMoMdbKjmdfxpXvEXH2vj0C4/AAAAAElFTkSuQmCC>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAAjCAYAAAApBFa1AAAE80lEQVR4Xu3d6attcxzH8a/MM/eKhJzrgVLGzPHE7CZDXLMHZOxGIiLjlSESMmRKIilRuBmKlJMUSvEf3FI88wd45vv2Xeuu31nto+js9r6d96s+7Wntc/e6jz791vr9fhGSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJGkbcGPmzS6PZY5f+vFW6zPHjt+cI/y2/jxeylyY2X3JEWWfzNOZe8cfSJIkzbP7uscdM3d1j5NQglr7Zy4ZvTdLJ2Y+y2yXOSXz1dKPt6KUfjp6j/PgfCRJkuZSX9h670eVHgrQs5nzu/ffyzyceSNzeGZL5rfMB93nszYuYrw+OLMm83zm/qgyyvu/RJ3bHVEjcX9lfshc8883JUmS5sy4sH2TWchszuybeTezX+bS7vMjM59HfW/83VmaVNi4VEpZuyizKXN29z6/n1L6cuaqzGLmQL6Uds1saMLrSdbGMBrZPpckSVpx49LFPWCUmh+jCgv3r1Fa+kuiFJvFmF5hOyJq5Kt1ciwtUeS8zM7NMePCRjk7NPNl1O/kOweNjuvPYTGGwnZM5rCoMrdDZo/u/da6zDNR98wtZG7KbIw6XpIkaUUx6eDnqOLxVuaj5jNG1K7O3BZVRJ7LnJZ5LarEcZ/Yx1HlijJ3Zfcd/iZl6dbuGEa4+DtcWuXYWzKXZa7LnJG5uDvmiahy9EBUYfovGEn7JPN71LlwHvwOUNr47J4YChu/m5G1VzN7R53TIzGU0ocyp3fPd4kqc336Asff4jwYvaP0MRLZlz5JkrTK3BA1OkTp4Z4sCgKl5MH2oCnZbfR6z8z2zeudoi4FMtrUl6y+4DzePVLkepQxcP/YSd1zyh3HPJo5IOp7/DsrjUugrXYWKZ+1r9+O+i2YVNg413OjLh9fHjVZg9LHpWNJkrQKUQK+j2HJDUaMGAFa7t6qWaBUMvrGZcoTokbTXowqNf3vphBt6p5zc/+ZmaOiRsI4hjJ3atTyImd1x80CI2ffZs6J5S9xHhc1qvZkVLFj5JD/g3EplCRJqwQjOosxXK7jEqVLUMweI299QWOU0bImSdIqx0gOI1CUt3Y2IuVtoXnN6ND45nziDEZJkqQpuzvqpnbKV4v7vf7PfVNPZX4yU8uHIUmSVh0uh/6Rubl7zeU37qNiCY72PqujM6/HsE1Tn0nbNEmSJGkFcUmzLV1cImXGKDfut7M25xH7drblkV0SJt3vxXHs88l+n5IkSds87l1bn7k+Ji/sOk8oZ2x31U+aYM01ytm4tPUL8o7XMmMmqSRJkqaM++/6wsZ2V4tRS3i0litsLLArSZKkKWsLW/+aWa8XRG0B9UJUUfs1ahFeLvlyCZjP/4xa0228iK8kSZJWUFvYWL/si6itq76LYemRQ2LpCBvfaR9ZMJhdERihI+wvOh6NAxMx2KCemZrsQEDx41GSJEn/oi1s7PtJUWPSBMWtvwdvXNgoXuC77IzApux7xbBzwrqYvBMB21oxsYHZsozMoX+UJEnSBEww2JL5OmqW6DsxLPbLyBeTENieiqK2ObMxaosrCh2uyNwew1Zc13aPYIZsu8/n2syaqG2imJjB5Vb0j5IkSZoiihhljdG5vrxNwmLCbCz/SubOqFmmPEqSJGlOsGYduz8w+kYYdZv3teokSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSdJkfwPlluY2SlLGcgAAAABJRU5ErkJggg==>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAARCAYAAACrfj41AAABfUlEQVR4Xu2VTStFQRzGH6HIe0TEAgthYSPJgiwUecnLRlm4ZaGsRBIbZGPn5RtYKx/Ayjfho3ie/v/ROXNPnKtbF91f/bq3mTnnPjPzn7lAlVw00Pa4kdTQprixklQkaCvtihvJAJ1x672t372h8/SI9rgKeEwXfWxZ6HMv6DtdTfUCm3SfDru3tA02Tp7SZnpAJ90tekjrEBFmIGdpbbo7N49IB1WgZzqUaLumaygOugfbbrkLW+0i/kzQJIP0nK7AApcSOg7aS1/9M6BgMtToAy3QOTrtLoTBedDLVXdyhzamuzMpJWhAh0sr3wmrZdlCT2AHTH3yS/SwvKLrUV8WPwkqktstt2G/p5LZcDPRdXIGO7EyXCnfEQdV7T3R0UTbHaxGk8TbrYnoPR10yc3kVwcdcS9R2snXv4rUxf1GX2AnWIpl2G0y4d7DJhBQaRVg2x/QRa9aHffvnxe/inXMTT5QLhSs240XYAoWNonGaEVVq9rNvDta5X/yAcUcPAxBOA8RAAAAAElFTkSuQmCC>