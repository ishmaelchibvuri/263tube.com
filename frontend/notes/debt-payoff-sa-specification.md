# Debt Payoff SA — Feature Specification & UI Structure

**Version:** 1.0  
**Platform:** React Native (iOS & Android)  
**Backend:** Node.js on AWS Cape Town  
**Banking Integration:** Stitch API

---

## Page 1: The "Financial Dignity" Dashboard (Home)

### Page Goal

Give the user an immediate sense of **control and progress** the moment they open the app. This isn't a debt tracker that shames—it's a command centre showing them they're winning.

### Key Data Inputs

- Total debt balance (aggregated from "My Debts")
- Total monthly payment allocation
- Selected repayment strategy
- Payment history (on-time streaks)
- Projected debt-free date
- Cumulative interest saved vs. minimum-payment scenario

### UI Layout & UX Flow

**Visual Hierarchy (Top to Bottom):**

1. **Greeting Header**
   - Personalised: "Sawubona, Thabo 👋" or "Dumelang, Lerato"
   - Current date and payment streak badge

2. **The Debt-Free Countdown (Hero Element)**
   - Large, circular countdown timer showing years/months/days
   - Pulsing animation when user is on track
   - Tappable to reveal: "Based on your current plan, you'll be debt-free by [Date]"
   - Colour states: Green (on track), Amber (at risk), Red (behind)

3. **The Freedom Bar™**
   - Horizontal progress bar with two layers:
     - **Grey layer:** What you would have paid in interest with minimum payments
     - **Green layer:** What you're actually paying with your strategy
   - The gap between them grows as they progress, with a running Rand figure: "R14,320 saved so far 🎉"
   - Micro-animation: Coins falling into a savings jar icon when the gap widens

4. **Quick Stats Row (3 Cards)**
   - Card 1: "Total Owed" — R156,430
   - Card 2: "This Month's Target" — R4,200
   - Card 3: "Debts Killed" — 2 of 7 (with confetti burst on tap)

5. **Priority Alert Banner (Conditional)**
   - Red banner if any debt has a Section 129 flag: "⚠️ Legal Action Risk: Your [Credit Card] needs urgent attention"
   - Tapping navigates to that debt's detail page

6. **Action Button**
   - Floating action button: "Log a Payment" — opens quick-entry modal

**Delighters:**

- When a debt is fully paid, trigger a full-screen celebration animation (confetti + sound)
- Weekly "Freedom Report" push notification showing interest saved that week
- Subtle parallax effect on the countdown timer when scrolling

### Backend Logic/Algorithm

```pseudo
// Calculate Debt-Free Date
function calculateDebtFreeDate(debts[], monthlyBudget, strategy) {
    sortedDebts = sortByStrategy(debts, strategy)
    simulationDate = today()
    remainingDebts = clone(sortedDebts)
    
    while (remainingDebts.length > 0) {
        availableFunds = monthlyBudget
        
        // Pay minimums on all debts first
        for each debt in remainingDebts:
            minimumPayment = debt.minimumPayment
            debt.balance = applyPayment(debt, minimumPayment)
            availableFunds -= minimumPayment
        
        // Apply avalanche/snowball surplus to target debt
        targetDebt = remainingDebts[0]
        targetDebt.balance = applyPayment(targetDebt, availableFunds)
        
        // Remove cleared debts
        remainingDebts = remainingDebts.filter(d => d.balance > 0)
        simulationDate = addMonths(simulationDate, 1)
    }
    
    return simulationDate
}

// Calculate Interest Saved (Freedom Bar)
function calculateInterestSaved(debts[], actualPayments[], strategy) {
    // Scenario A: Minimum payments only
    minPaymentInterest = simulateMinimumPayments(debts)
    
    // Scenario B: User's actual payments with strategy
    actualInterest = simulateActualPayments(debts, actualPayments, strategy)
    
    return minPaymentInterest - actualInterest
}

// Apply Payment with SA-specific fees
function applyPayment(debt, paymentAmount) {
    // Order of application per NCA Section 126:
    // 1. Outstanding fees and charges
    // 2. Accrued interest
    // 3. Principal
    
    remainingPayment = paymentAmount
    
    // Deduct monthly service fee
    remainingPayment -= debt.monthlyServiceFee
    
    // Deduct credit life insurance
    remainingPayment -= debt.creditLifePremium
    
    // Calculate monthly interest
    monthlyInterest = debt.balance * (debt.annualRate / 12 / 100)
    
    // Check In Duplum cap before adding interest
    if (debt.accumulatedInterestAndFees < debt.originalPrincipal) {
        applicableInterest = min(
            monthlyInterest,
            debt.originalPrincipal - debt.accumulatedInterestAndFees
        )
        debt.accumulatedInterestAndFees += applicableInterest
        remainingPayment -= applicableInterest
    }
    
    // Remainder reduces principal
    debt.balance -= remainingPayment
    
    return max(debt.balance, 0)
}
```

---

## Page 2: "My Debts" (The Liability Engine)

### Page Goal

Capture a complete, legally accurate picture of each debt—including the hidden costs that South African credit providers bury in the fine print.

### Key Data Inputs

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Debt Name | Text | Required | e.g., "Capitec Credit Card" |
| Creditor | Dropdown + Custom | Required | Pre-populated list of major SA lenders |
| Account Number | Text | Optional | For user reference |
| Original Principal | Currency (ZAR) | Required | The amount originally borrowed |
| Opening Balance | Currency (ZAR) | Required | Balance when agreement started |
| Current Balance | Currency (ZAR) | Required | Today's outstanding amount |
| Interest Rate | Percentage | Required, max 27.25% (NCA cap for unsecured) | Annual rate |
| Monthly Service Fee | Currency (ZAR) | Default R0 | e.g., R69 for store cards |
| Credit Life Insurance Premium | Currency (ZAR) | Default R0 | Monthly premium if bundled |
| Initiation Fee Balance | Currency (ZAR) | Default R0 | Remaining capitalised initiation fee |
| Minimum Monthly Payment | Currency (ZAR) | Required | Contractual minimum |
| Payment Due Date | Day of month | Required | 1-31 |
| **Section 129 Flag** | Toggle | Default OFF | "Have you received a Section 129 Letter of Demand?" |
| Date of Section 129 Letter | Date | Required if flag ON | Triggers 10 business day countdown |

### UI Layout & UX Flow

**Screen Structure:**

1. **Debt List View (Default)**
   - Cards for each debt showing: Name, Balance, Interest Rate, Status Badge
   - Status Badges:
     - 🟢 "On Track"
     - 🟡 "In Duplum Zone" (approaching cap)
     - 🔴 "Section 129 Active"
   - Swipe left to archive (paid off), swipe right to edit
   - Sort/filter pills: "Highest Interest," "Smallest Balance," "Legal Priority"

2. **Add Debt Flow (Multi-Step Modal)**
   
   **Step 1: Basic Info**
   - Creditor selection (searchable dropdown with bank logos)
   - Debt nickname
   - Account number (optional)
   
   **Step 2: The Numbers**
   - Original Principal (with tooltip: "This is the amount you first borrowed, before any interest")
   - Current Balance
   - Interest Rate (with NCA cap warning if exceeded)
   - Minimum Payment
   - Due Date (calendar picker)
   
   **Step 3: Hidden Costs (SA-Specific)**
   - Header: "Let's find the fees they don't advertise"
   - Monthly Service Fee input with common examples: "Most store cards charge R50-R69"
   - Credit Life Premium with explanation: "Check your statement for 'Credit Life' or 'Insurance'"
   - Initiation Fee Balance: "Usually only on personal loans, often capitalised"
   
   **Step 4: Legal Status**
   - Section 129 Toggle with explainer modal:
     > "A Section 129 letter is a formal legal notice. If you've received one, you have 10 business days to respond or the creditor can take legal action. This debt must be prioritised."
   - If toggled ON: Date picker appears, countdown begins

3. **Debt Detail View**
   - Full breakdown of costs
   - Payment history graph
   - In Duplum tracker (visual meter showing accumulated interest vs. principal)
   - "Dispute This Debt" button (links to template letters)

**Delighters:**

- Stitch API integration: "Connect Bank Account" button that auto-imports debts from statements
- When adding a debt, show encouraging copy: "Every debt you track is one step closer to freedom"
- Completion celebration when all debts are captured: "Your battlefield is mapped. Let's plan the attack."

### Backend Logic/Algorithm

```pseudo
// Debt Object Schema
DebtSchema = {
    id: UUID,
    userId: UUID,
    creditor: String,
    accountNumber: String (encrypted),
    originalPrincipal: Decimal,
    openingBalance: Decimal,
    currentBalance: Decimal,
    annualInterestRate: Decimal,
    monthlyServiceFee: Decimal,
    creditLifePremium: Decimal,
    initiationFeeBalance: Decimal,
    minimumPayment: Decimal,
    paymentDueDay: Integer (1-31),
    
    // Section 129 Tracking
    section129Received: Boolean,
    section129Date: Date | null,
    section129Deadline: Date | null,  // Calculated: +10 business days
    
    // In Duplum Tracking
    accumulatedInterestAndFees: Decimal,  // Running total since inception
    inDuplumCapReached: Boolean,
    
    // Metadata
    createdAt: DateTime,
    updatedAt: DateTime,
    paidOffAt: DateTime | null
}

// Calculate Section 129 Deadline (10 business days)
function calculateSection129Deadline(letterDate) {
    deadline = letterDate
    businessDaysAdded = 0
    
    while (businessDaysAdded < 10) {
        deadline = addDays(deadline, 1)
        
        // Skip weekends
        if (isWeekday(deadline)) {
            // Skip SA public holidays
            if (!isSAPublicHoliday(deadline)) {
                businessDaysAdded++
            }
        }
    }
    
    return deadline
}

// Validate Interest Rate Against NCA Caps
function validateInterestRate(rate, debtType) {
    // NCA maximum rates (as of 2024, adjusted by repo rate)
    maxRates = {
        "mortgage": repoRate + 12,        // ~20%
        "vehicle": repoRate + 15,         // ~23%
        "unsecured": repoRate + 19.25,    // ~27.25%
        "shortTerm": 5% per month (60% p.a.)  // Short-term loans
    }
    
    if (rate > maxRates[debtType]) {
        return {
            valid: false,
            warning: "This rate exceeds the NCA maximum of {maxRates[debtType]}%. You may have grounds to dispute."
        }
    }
    
    return { valid: true }
}

// Priority Score for Debt Ordering
function calculatePriorityScore(debt) {
    score = 0
    
    // Section 129 is highest priority
    if (debt.section129Received && debt.section129Deadline > today()) {
        daysRemaining = daysBetween(today(), debt.section129Deadline)
        score += 10000 - (daysRemaining * 100)  // Urgency increases as deadline approaches
    }
    
    // In Duplum proximity (debts close to cap should be deprioritised)
    inDuplumRatio = debt.accumulatedInterestAndFees / debt.originalPrincipal
    if (inDuplumRatio >= 0.9) {
        score -= 500  // Deprioritise, interest is about to cap
    }
    
    return score
}
```

---

## Page 3: The Strategy Hub (Snowball vs. Avalanche vs. In Duplum)

### Page Goal

Empower users to choose their repayment strategy with full transparency on the trade-offs—while intelligently overriding their choice when legal realities (Section 129) or mathematical optimisations (In Duplum) demand it.

### Key Data Inputs

- All debts from "My Debts" module
- Monthly debt repayment budget (from "Family & Life" Budget)
- User's selected strategy preference
- Historical payment data (for projections)

### UI Layout & UX Flow

**Screen Structure:**

1. **Strategy Selector (Top Section)**
   
   Three tappable cards in a horizontal scroll:
   
   **Card 1: Snowball ❄️**
   - Tagline: "Small wins, big momentum"
   - Description: "Pay smallest debts first. Feel the progress."
   - Icon: Snowball rolling downhill, growing larger
   
   **Card 2: Avalanche 🏔️**
   - Tagline: "Maximum savings"
   - Description: "Attack highest interest first. Save the most money."
   - Icon: Mountain peak with money symbols
   
   **Card 3: Smart SA Mode 🇿🇦** (Default/Recommended)
   - Tagline: "Built for South African realities"
   - Description: "Prioritises legal deadlines, then optimises for In Duplum savings."
   - Badge: "Recommended"
   - Icon: Shield with ZA flag colours

2. **The Comparison Engine (Middle Section)**
   
   Side-by-side cards showing outcomes:
   
   | Metric | Snowball | Avalanche | Smart SA |
   |--------|----------|-----------|----------|
   | Debt-Free Date | March 2028 | December 2027 | January 2028 |
   | Total Interest Paid | R48,200 | R36,100 | R37,800 |
   | Interest Saved vs. Minimum | R22,000 | R34,100 | R32,400 |
   | First Debt Cleared | 4 months | 11 months | 6 months |
   
   Highlight banner: "**Avalanche saves you R12,100** but Snowball gives you a win in 4 months. Smart SA balances both."

3. **The Attack Order (Bottom Section)**
   
   Ordered list of debts based on selected strategy:
   
   ```
   YOUR ATTACK ORDER (Smart SA Mode)
   
   1. 🔴 Woolworths Card — R8,200
      "Section 129 Active - 6 days to respond"
      [PAY NOW button]
   
   2. 🟡 African Bank Loan — R45,000  
      "In Duplum: 94% reached. Interest capping soon."
      "Suggested: Pay minimums only until interest caps"
   
   3. ⚪ Capitec Credit Card — R12,400
      "22.5% interest - High priority for savings"
   
   4. ⚪ FNB Personal Loan — R38,000
      "18% interest"
   
   5. ⚪ Mr Price Card — R2,100
      "Smallest balance - Quick win available"
   ```

4. **In Duplum Insight Panel (Expandable)**
   
   Collapsible card explaining the strategy:
   > "**What is In Duplum?**  
   > Under NCA Section 103(5), a creditor cannot charge you more in interest, fees, and insurance than your original loan amount. If your African Bank loan started at R30,000, they can only ever charge R30,000 in additional costs—total.
   >
   > **Why does this affect my strategy?**  
   > Your African Bank loan is at 94% of its cap. In approximately 2 months, interest will legally stop accumulating. Smart SA Mode suggests paying only the minimum until then, so you can redirect funds to debts that are still costing you."

**Delighters:**

- Animated flow showing money moving between debts when switching strategies
- "What if" slider: "If you added R500 more per month..." with real-time recalculation
- Achievement badge: "Strategist" unlocked when user views all three strategies

### Backend Logic/Algorithm

```pseudo
// Core Strategy Engine
function generateAttackOrder(debts[], strategy, monthlyBudget) {
    // Step 1: Always prioritise Section 129 debts (legal override)
    section129Debts = debts.filter(d => d.section129Received && !d.section129Deadline.isPast())
    section129Debts.sortBy(d => d.section129Deadline)  // Most urgent first
    
    // Step 2: Identify In Duplum candidates
    inDuplumDebts = debts.filter(d => {
        ratio = d.accumulatedInterestAndFees / d.originalPrincipal
        return ratio >= 0.85 && ratio < 1.0  // 85-100% of cap
    })
    
    // Step 3: Sort remaining debts by strategy
    remainingDebts = debts.filter(d => 
        !section129Debts.includes(d) && !inDuplumDebts.includes(d)
    )
    
    switch(strategy) {
        case "SNOWBALL":
            remainingDebts.sortBy(d => d.currentBalance, ASC)
            break
        case "AVALANCHE":
            remainingDebts.sortBy(d => d.annualInterestRate, DESC)
            break
        case "SMART_SA":
            // Hybrid: High interest first, but consider In Duplum proximity
            remainingDebts.sortBy(d => {
                interestScore = d.annualInterestRate * 100
                inDuplumRatio = d.accumulatedInterestAndFees / d.originalPrincipal
                
                // Reduce priority if approaching In Duplum cap
                if (inDuplumRatio > 0.7) {
                    interestScore *= (1 - inDuplumRatio)
                }
                
                return interestScore
            }, DESC)
            break
    }
    
    // Step 4: Combine with priorities
    attackOrder = [
        ...section129Debts.map(d => ({ ...d, priority: "LEGAL" })),
        ...remainingDebts.map(d => ({ ...d, priority: "STRATEGY" })),
        ...inDuplumDebts.map(d => ({ ...d, priority: "IN_DUPLUM_WATCH" }))
    ]
    
    return attackOrder
}

// Calculate Strategy Outcomes
function simulateStrategy(debts[], strategy, monthlyBudget) {
    simulatedDebts = deepClone(debts)
    attackOrder = generateAttackOrder(simulatedDebts, strategy, monthlyBudget)
    
    totalInterestPaid = 0
    monthsToFreedom = 0
    firstDebtClearedMonth = null
    
    while (simulatedDebts.some(d => d.currentBalance > 0)) {
        monthsToFreedom++
        availableFunds = monthlyBudget
        
        // Pay all minimums
        for each debt in simulatedDebts:
            if (debt.currentBalance > 0) {
                payment = min(debt.minimumPayment, debt.currentBalance)
                result = applyPaymentWithInterest(debt, payment)
                totalInterestPaid += result.interestCharged
                availableFunds -= payment
        
        // Apply surplus to target debt
        targetDebt = attackOrder.find(d => d.currentBalance > 0)
        if (targetDebt && availableFunds > 0) {
            extraPayment = min(availableFunds, targetDebt.currentBalance)
            applyPaymentWithInterest(targetDebt, extraPayment)
        
        // Track first debt cleared
        if (firstDebtClearedMonth === null) {
            clearedDebt = simulatedDebts.find(d => d.currentBalance <= 0)
            if (clearedDebt) {
                firstDebtClearedMonth = monthsToFreedom
            }
        }
    }
    
    return {
        totalInterestPaid,
        monthsToFreedom,
        debtFreeDate: addMonths(today(), monthsToFreedom),
        firstDebtClearedMonth
    }
}

// In Duplum Monitoring
function calculateInDuplumStatus(debt) {
    ratio = debt.accumulatedInterestAndFees / debt.originalPrincipal
    
    if (ratio >= 1.0) {
        return {
            status: "CAPPED",
            message: "Interest has legally stopped accumulating.",
            recommendation: "Pay minimum only. Redirect funds elsewhere."
        }
    } else if (ratio >= 0.85) {
        monthsToCapFunction = estimateMonthsToInDuplumCap(debt)
        return {
            status: "APPROACHING",
            percentage: ratio * 100,
            estimatedMonthsToCap: monthsToCapFunction,
            message: `Interest will cap in ~${monthsToCapFunction} months.`,
            recommendation: "Consider paying minimums and redirecting surplus."
        }
    } else {
        return {
            status: "ACTIVE",
            percentage: ratio * 100,
            message: "Interest is actively accumulating."
        }
    }
}

function estimateMonthsToInDuplumCap(debt) {
    remainingCapRoom = debt.originalPrincipal - debt.accumulatedInterestAndFees
    monthlyInterestAndFees = (debt.currentBalance * debt.annualInterestRate / 12 / 100) 
                            + debt.monthlyServiceFee 
                            + debt.creditLifePremium
    
    if (monthlyInterestAndFees <= 0) return Infinity
    
    return Math.ceil(remainingCapRoom / monthlyInterestAndFees)
}
```

---

## Page 4: The "Family & Life" Budget

### Page Goal

Create a realistic budget that respects South African financial culture—where supporting extended family isn't optional, it's a non-negotiable part of life. The output is a clear "Debt Attack Amount" that the user can actually commit to.

### Key Data Inputs

**Income Section:**

- Net Monthly Salary (after tax, UIF, pension)
- Secondary Income (piece jobs, side hustles)
- Partner's Contribution (if shared household)
- Grants (SASSA Child Support, etc.)

**Fixed Obligations:**

| Category | Examples | Notes |
|----------|----------|-------|
| Housing | Rent, Bond, Levies | |
| Transport | Petrol, Taxi fare, Car payment | |
| Utilities | Electricity, Water, WiFi/Data | |
| Insurance | Car, Household, Funeral policies | Funeral cover is culturally essential |
| Education | School fees, Uniforms, Transport | |
| **Family Support / Black Tax** | Support to parents, siblings, extended family | **Fixed obligation, not discretionary** |

**Variable Expenses:**

| Category | Examples |
|----------|----------|
| Groceries | Food, household supplies |
| Personal Care | Toiletries, haircuts |
| Health | Medical, pharmacy |
| Entertainment | Optional spending |

### UI Layout & UX Flow

**Screen Structure:**

1. **Income Input Section**
   
   Clean card with inputs:
   - "What hits your bank account each month?" (Net salary)
   - "+ Add other income" expandable section
   - Running total displayed prominently

2. **The Obligations Waterfall**
   
   Visual representation as a waterfall/funnel:
   
   ```
   NET INCOME: R25,000
        │
        ▼ Housing (R6,500)
        │ ═══════════════
        │
        ▼ Transport (R3,200)
        │ ════════════════
        │
        ▼ Utilities (R1,800)
        │ ═══════════
        │
        ▼ Insurance (R950)
        │ ══════
        │
        ▼ Education (R2,400)
        │ ═══════════════
        │
        ▼ ❤️ Family Support (R3,000)
        │ ══════════════════════════
        │
        ▼ Groceries & Living (R4,500)
        │ ═════════════════════
        │
        ═══════════════════════════════
        DEBT ATTACK AMOUNT: R2,650
   ```

3. **Family Support Section (Highlighted)**
   
   Special treatment with warm design:
   
   > **"Family Support / Black Tax"**  
   > *This isn't optional. We know.*
   >
   > [R3,000 input field]
   >
   > *"Supporting family is part of who we are. This amount is protected in your budget—it won't be suggested for debt repayment."*
   
   Optional breakdown (collapsible):
   - Parents: R____
   - Siblings: R____
   - Extended family: R____
   - Community/Stokvel: R____

4. **The Reality Check Panel**
   
   After all inputs:
   
   ```
   ┌─────────────────────────────────────┐
   │  YOUR DEBT ATTACK BUDGET            │
   │                                     │
   │  R2,650 per month                   │
   │                                     │
   │  This pays off all debt in:         │
   │  ████████░░ 34 months               │
   │                                     │
   │  [Adjust Budget] [Accept & Continue]│
   └─────────────────────────────────────┘
   ```
   
   If budget is negative or very low:
   
   ```
   ┌─────────────────────────────────────┐
   │  ⚠️ YOUR NUMBERS DON'T ADD UP       │
   │                                     │
   │  Monthly shortfall: R1,200          │
   │                                     │
   │  This is common. Let's explore:     │
   │  • [Review expenses for savings]    │
   │  • [Learn about Debt Review]        │
   │  • [Speak to a debt counsellor]     │
   └─────────────────────────────────────┘
   ```

5. **Expense Entry UX**
   
   For each category:
   - Suggested range based on SA averages (e.g., "Most users spend R3,000-R5,000 on groceries")
   - Quick-select common amounts
   - Option to link bank transactions via Stitch for auto-categorisation

**Delighters:**

- "Found Money" celebrations: If user enters lower expense than last month, show: "You freed up R200! That's 2 extra months off your debt journey"
- Budget template presets: "Single professional in Joburg," "Family of 4 in Cape Town," "Rural household"
- No judgement on any category—especially Family Support. Zero "reduce this spending" suggestions for that line

### Backend Logic/Algorithm

```pseudo
// Budget Calculation Engine
BudgetSchema = {
    userId: UUID,
    
    // Income
    netSalary: Decimal,
    secondaryIncome: Decimal,
    partnerContribution: Decimal,
    grants: Decimal,
    
    // Fixed Obligations (Cannot be reduced in debt calculations)
    housing: Decimal,
    transport: Decimal,
    utilities: Decimal,
    insurance: Decimal,
    education: Decimal,
    familySupport: Decimal,  // Protected category
    
    // Variable Expenses
    groceries: Decimal,
    personalCare: Decimal,
    health: Decimal,
    entertainment: Decimal,
    other: Decimal,
    
    // Calculated Fields
    totalIncome: Decimal,
    totalFixedObligations: Decimal,
    totalVariableExpenses: Decimal,
    debtAttackBudget: Decimal,
    
    createdAt: DateTime,
    updatedAt: DateTime
}

function calculateDebtAttackBudget(budget) {
    // Total Income
    totalIncome = budget.netSalary 
                + budget.secondaryIncome 
                + budget.partnerContribution 
                + budget.grants
    
    // Fixed Obligations (includes Family Support as NON-NEGOTIABLE)
    fixedObligations = budget.housing 
                     + budget.transport 
                     + budget.utilities 
                     + budget.insurance 
                     + budget.education 
                     + budget.familySupport  // Never suggest reducing this
    
    // Variable Living Expenses
    variableExpenses = budget.groceries 
                     + budget.personalCare 
                     + budget.health 
                     + budget.entertainment 
                     + budget.other
    
    // Debt Attack Budget = What's left after living
    debtAttackBudget = totalIncome - fixedObligations - variableExpenses
    
    return {
        totalIncome,
        fixedObligations,
        variableExpenses,
        debtAttackBudget,
        isViable: debtAttackBudget >= sumOfMinimumPayments(userDebts)
    }
}

// Validate Budget Viability
function assessBudgetViability(budget, debts[]) {
    minimumRequired = debts.sum(d => d.minimumPayment)
    
    if (budget.debtAttackBudget < 0) {
        return {
            status: "DEFICIT",
            shortfall: Math.abs(budget.debtAttackBudget),
            recommendation: "DEBT_COUNSELLING_SUGGESTED",
            message: "Your expenses exceed your income. Debt Review may help restructure your payments."
        }
    }
    
    if (budget.debtAttackBudget < minimumRequired) {
        return {
            status: "BELOW_MINIMUM",
            shortfall: minimumRequired - budget.debtAttackBudget,
            recommendation: "EXPENSE_REVIEW_OR_COUNSELLING",
            message: "Your budget doesn't cover minimum payments. Let's review expenses or consider Debt Review."
        }
    }
    
    if (budget.debtAttackBudget < minimumRequired * 1.2) {
        return {
            status: "TIGHT",
            surplus: budget.debtAttackBudget - minimumRequired,
            recommendation: "PROCEED_WITH_CAUTION",
            message: "Your budget is tight. Any unexpected expense could derail progress."
        }
    }
    
    return {
        status: "HEALTHY",
        surplus: budget.debtAttackBudget - minimumRequired,
        recommendation: "PROCEED",
        message: "You have room to attack debt aggressively."
    }
}

// Suggestion Engine (Never touches Family Support)
function suggestBudgetOptimisations(budget) {
    suggestions = []
    
    // Only suggest reductions on variable/optional categories
    if (budget.entertainment > 500) {
        suggestions.push({
            category: "entertainment",
            current: budget.entertainment,
            suggested: budget.entertainment * 0.5,
            savings: budget.entertainment * 0.5,
            message: "Reducing entertainment could add R{savings} to debt payments"
        })
    }
    
    // NEVER suggest reducing familySupport
    // This is intentionally omitted from the suggestion engine
    
    return suggestions
}
```

---

## Page 5: The "In Duplum" Audit Tool

### Page Goal

Provide a powerful, user-friendly tool that checks whether any creditor has illegally overcharged the user under NCA Section 103(5). If violations are found, generate actionable outputs: warnings, calculations, and template dispute letters.

### Key Data Inputs

For each debt being audited:

- Original Principal (the amount first borrowed)
- Current Total Outstanding (as stated by creditor)
- Breakdown provided by creditor:
  - Principal remaining
  - Accumulated interest
  - Accumulated fees
  - Accumulated insurance premiums
- Date of credit agreement
- All statements (if available via Stitch)

### UI Layout & UX Flow

**Screen Structure:**

1. **Introduction Panel**
   
   Educational header:
   
   > **In Duplum: Your Legal Shield**
   >
   > South African law (NCA Section 103(5)) protects you. A creditor can NEVER charge you more in interest, fees, and insurance than your original loan amount.
   >
   > *Example: If you borrowed R20,000, the maximum they can ever charge in total costs is R20,000—no matter how long you take to pay.*
   >
   > Let's check if any of your debts have crossed this line.

2. **Debt Audit Cards**
   
   For each debt, an expandable card:
   
   ```
   ┌─────────────────────────────────────┐
   │ 🏦 African Bank Personal Loan       │
   │                                     │
   │ Original Principal:     R30,000     │
   │ Maximum Allowed Costs:  R30,000     │
   │ ─────────────────────────────────── │
   │ Accumulated Interest:   R24,500     │
   │ Accumulated Fees:       R4,200      │
   │ Accumulated Insurance:  R3,800      │
   │ ─────────────────────────────────── │
   │ TOTAL COSTS CHARGED:    R32,500     │
   │                                     │
   │ ⚠️ EXCEEDED BY R2,500               │
   │                                     │
   │ [View Calculation] [Generate Letter]│
   └─────────────────────────────────────┘
   ```
   
   Status indicators:
   - 🟢 "Compliant" — Costs below 50% of cap
   - 🟡 "Approaching Cap" — Costs at 50-85% of cap
   - 🟠 "Near Cap" — Costs at 85-99% of cap
   - 🔴 "Cap Breached" — Costs exceed original principal

3. **Detailed Calculation View (Modal)**
   
   When user taps "View Calculation":
   
   ```
   IN DUPLUM CALCULATION
   African Bank Personal Loan
   Agreement Date: 15 March 2021
   
   ═══════════════════════════════════════
   ORIGINAL PRINCIPAL:           R30,000.00
   ═══════════════════════════════════════
   This is your In Duplum cap. Total costs
   can never legally exceed this amount.
   ═══════════════════════════════════════
   
   COSTS CHARGED TO DATE:
   ├─ Interest:                  R24,500.00
   ├─ Monthly Service Fees:       R2,484.00
   │  (R69 × 36 months)
   ├─ Credit Life Insurance:      R1,716.00
   │  (R47.67 × 36 months)
   └─ Initiation Fee:                R0.00
      (Fully amortised)
   ───────────────────────────────────────
   TOTAL COSTS:                  R28,700.00
   ───────────────────────────────────────
   
   REMAINING CAP ROOM:            R1,300.00
   
   At current rates, the cap will be reached
   in approximately 2 months.
   
   [Close] [Generate Stop-Interest Letter]
   ```

4. **Letter Generator (Critical Feature)**
   
   If cap is breached or approaching:
   
   ```
   GENERATE DISPUTE LETTER
   
   Choose letter type:
   
   ○ In Duplum Cap Reached
     "Request creditor to stop charging interest"
   
   ○ In Duplum Cap Breached  
     "Demand refund of illegally charged amounts"
   
   ○ Request Statement Breakdown
     "Request itemised cost breakdown for audit"
   
   Your details:
   [Full Name: _______________]
   [ID Number: _______________]
   [Address: _________________]
   
   [Preview Letter] [Download PDF] [Email to Self]
   ```

5. **Generated Letter Preview**
   
   Professional template:
   
   ```
   ─────────────────────────────────────────
   [User Name]
   [User Address]
   [Date]
   
   TO: African Bank Limited
   RE: Account Number [XXXXX]
   SUBJECT: In Duplum Cap Notification per NCA Section 103(5)
   
   Dear Sir/Madam,
   
   I write in terms of Section 103(5) of the National Credit Act 34 
   of 2005, which provides that the total interest, fees, and cost 
   of credit insurance charged may not exceed the original principal 
   debt.
   
   According to my records:
   • Original Principal Debt: R30,000.00
   • Maximum Allowable Costs: R30,000.00
   • Costs Charged to Date: R32,500.00
   • Amount Exceeding Cap: R2,500.00
   
   I hereby demand that you:
   1. Cease all further interest charges on this account
   2. Credit my account with the amount of R2,500.00 
      overcharged in violation of Section 103(5)
   3. Provide a revised statement reflecting the corrected balance
   
   Failure to comply within 20 business days will result in a 
   complaint to the National Credit Regulator.
   
   Yours faithfully,
   [User Name]
   [User Signature]
   ─────────────────────────────────────────
   
   [Edit] [Download PDF] [Copy Text]
   ```

**Delighters:**

- "Audit All Debts" button that runs calculation across entire portfolio
- Shareable audit report for debt counsellors or attorneys
- Push notification when any debt reaches 90% of In Duplum cap
- Success stories: "Users have recovered R2.3 million in overcharges using this tool"

### Backend Logic/Algorithm

```pseudo
// In Duplum Audit Engine
InDuplumAuditSchema = {
    debtId: UUID,
    auditDate: DateTime,
    
    // Core values
    originalPrincipal: Decimal,
    inDuplumCap: Decimal,  // Equal to originalPrincipal
    
    // Cost breakdown
    accumulatedInterest: Decimal,
    accumulatedFees: Decimal,
    accumulatedInsurance: Decimal,
    totalCostsCharged: Decimal,
    
    // Calculation results
    capRemaining: Decimal,
    capExceeded: Boolean,
    excessAmount: Decimal,
    capPercentageUsed: Decimal,
    
    // Projections
    estimatedMonthsToCapFromCurrent: Integer,
    
    // Status
    status: Enum["COMPLIANT", "APPROACHING", "NEAR_CAP", "BREACHED"],
    
    generatedAt: DateTime
}

function performInDuplumAudit(debt) {
    audit = new InDuplumAuditSchema()
    
    // Step 1: Establish the cap
    audit.originalPrincipal = debt.originalPrincipal
    audit.inDuplumCap = debt.originalPrincipal  // Per NCA 103(5)
    
    // Step 2: Calculate total costs charged
    // Note: We need historical data or creditor statement
    audit.accumulatedInterest = debt.accumulatedInterest
    audit.accumulatedFees = calculateAccumulatedFees(debt)
    audit.accumulatedInsurance = calculateAccumulatedInsurance(debt)
    
    audit.totalCostsCharged = audit.accumulatedInterest 
                            + audit.accumulatedFees 
                            + audit.accumulatedInsurance
    
    // Step 3: Compare to cap
    audit.capRemaining = audit.inDuplumCap - audit.totalCostsCharged
    audit.capExceeded = audit.totalCostsCharged > audit.inDuplumCap
    audit.excessAmount = max(0, audit.totalCostsCharged - audit.inDuplumCap)
    audit.capPercentageUsed = (audit.totalCostsCharged / audit.inDuplumCap) * 100
    
    // Step 4: Determine status
    if (audit.capExceeded) {
        audit.status = "BREACHED"
    } else if (audit.capPercentageUsed >= 85) {
        audit.status = "NEAR_CAP"
    } else if (audit.capPercentageUsed >= 50) {
        audit.status = "APPROACHING"
    } else {
        audit.status = "COMPLIANT"
    }
    
    // Step 5: Project time to cap (if not breached)
    if (!audit.capExceeded) {
        audit.estimatedMonthsToCapFromCurrent = estimateMonthsToInDuplumCap(debt)
    }
    
    return audit
}

function calculateAccumulatedFees(debt) {
    // Calculate total fees paid since account opening
    monthsSinceOpening = monthsBetween(debt.agreementDate, today())
    
    // Monthly recurring fees
    totalServiceFees = debt.monthlyServiceFee * monthsSinceOpening
    
    // Once-off fees (initiation fee - may be capitalised)
    initiationFee = debt.initiationFee  // Usually added to principal
    
    // Annual fees if applicable
    annualFees = debt.annualFee * (monthsSinceOpening / 12)
    
    return totalServiceFees + initiationFee + annualFees
}

function calculateAccumulatedInsurance(debt) {
    monthsSinceOpening = monthsBetween(debt.agreementDate, today())
    return debt.creditLifePremium * monthsSinceOpening
}

// Letter Generation Engine
function generateInDuplumLetter(audit, letterType, userDetails) {
    templates = {
        "CAP_REACHED": loadTemplate("in_duplum_stop_interest"),
        "CAP_BREACHED": loadTemplate("in_duplum_demand_refund"),
        "REQUEST_BREAKDOWN": loadTemplate("request_statement")
    }
    
    template = templates[letterType]
    
    // Populate template variables
    letter = template.replace({
        "{{USER_NAME}}": userDetails.fullName,
        "{{USER_ADDRESS}}": userDetails.address,
        "{{USER_ID}}": maskIdNumber(userDetails.idNumber),
        "{{DATE}}": formatDate(today()),
        "{{CREDITOR_NAME}}": audit.debt.creditorName,
        "{{ACCOUNT_NUMBER}}": maskAccountNumber(audit.debt.accountNumber),
        "{{ORIGINAL_PRINCIPAL}}": formatCurrency(audit.originalPrincipal),
        "{{IN_DUPLUM_CAP}}": formatCurrency(audit.inDuplumCap),
        "{{TOTAL_COSTS}}": formatCurrency(audit.totalCostsCharged),
        "{{EXCESS_AMOUNT}}": formatCurrency(audit.excessAmount),
        "{{INTEREST_CHARGED}}": formatCurrency(audit.accumulatedInterest),
        "{{FEES_CHARGED}}": formatCurrency(audit.accumulatedFees),
        "{{INSURANCE_CHARGED}}": formatCurrency(audit.accumulatedInsurance)
    })
    
    return {
        content: letter,
        pdfUrl: generatePDF(letter),
        wordUrl: generateWord(letter)
    }
}

// Alert System for Approaching Cap
function scheduleInDuplumAlerts(debt, audit) {
    if (audit.status === "NEAR_CAP") {
        // Schedule notification
        scheduleNotification({
            userId: debt.userId,
            type: "IN_DUPLUM_WARNING",
            title: "Interest Cap Alert",
            body: `Your ${debt.creditorName} loan is at ${audit.capPercentageUsed.toFixed(0)}% of its legal interest cap.`,
            scheduledFor: today(),
            data: {
                debtId: debt.id,
                action: "VIEW_IN_DUPLUM_AUDIT"
            }
        })
    }
    
    // Schedule follow-up when cap is projected to hit
    if (audit.estimatedMonthsToCapFromCurrent && audit.estimatedMonthsToCapFromCurrent <= 3) {
        scheduleNotification({
            userId: debt.userId,
            type: "IN_DUPLUM_IMMINENT",
            title: "Interest Cap Imminent",
            body: `Your ${debt.creditorName} interest cap will be reached in ~${audit.estimatedMonthsToCapFromCurrent} months. Consider adjusting your strategy.`,
            scheduledFor: addMonths(today(), max(1, audit.estimatedMonthsToCapFromCurrent - 1)),
            data: {
                debtId: debt.id,
                action: "VIEW_STRATEGY_HUB"
            }
        })
    }
}
```

---

## Summary: Developer Handoff Checklist

| Module | Key SA-Specific Features | Priority |
|--------|-------------------------|----------|
| Dashboard | Freedom Bar™, Section 129 alerts | P0 |
| My Debts | Full fee capture, Section 129 flag, In Duplum tracking | P0 |
| Strategy Hub | Smart SA Mode with In Duplum optimisation | P0 |
| Budget | Protected Family Support category | P0 |
| In Duplum Audit | NCA 103(5) calculator, Letter generator | P1 |

**Data Model Dependencies:**

- Stitch API integration for statement import
- SA public holiday calendar for Section 129 calculations
- NCA rate caps (updated quarterly based on repo rate)
- Letter templates reviewed by legal professional

**Regulatory Compliance Notes:**

- POPIA: All personal data encrypted at rest and in transit
- FAIS: App provides tools, not financial advice—clear disclaimers required
- NCA: All calculations auditable, letter templates legally reviewed

---

*This specification is ready for developer implementation. Prioritise Pages 1-4 for MVP; Page 5 (In Duplum Audit) can be Phase 2 but represents the highest differentiation potential.*
