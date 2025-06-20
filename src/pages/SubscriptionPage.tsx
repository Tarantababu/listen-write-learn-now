"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Check, X, CreditCard, Shield, CalendarClock, Award, AlertTriangle, Ban, Globe2 } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { trackButtonClick } from "@/utils/visitorTracking"
import { SUBSCRIPTION_PLANS, AVAILABLE_CURRENCIES, formatPrice, convertPrice, type PlanType } from "@/lib/stripe"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

const SubscriptionPage: React.FC = () => {
  const {
    subscription,
    checkSubscription,
    createCheckoutSession,
    openCustomerPortal,
    selectedCurrency,
    setSelectedCurrency,
  } = useSubscription()

  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState("plans")

  // Auto-refresh subscription status
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        checkSubscription()
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [user])

  const handleSubscribe = async (planId: string, price: number) => {
    setIsProcessing(true)
    try {
      // Pass the dynamic price to createCheckoutSession
      const checkoutUrl = await createCheckoutSession(price)
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManageSubscription = async () => {
    setIsProcessing(true)
    try {
      const portalUrl = await openCustomerPortal()
      if (portalUrl) {
        window.location.href = portalUrl
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Show error state if there's an error checking subscription
  if (subscription.error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <CreditCard className="mr-2 h-6 w-6 text-primary" />
            Subscription Management
          </h1>
        </div>

        <Card className="border-2 shadow-lg overflow-hidden relative border-yellow-300/50 bg-yellow-50/20 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Subscription Status Unavailable
            </CardTitle>
            <CardDescription className="text-yellow-600 dark:text-yellow-500">{subscription.error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We're currently experiencing issues with our subscription service. This might be due to maintenance or
              temporary service disruption.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={checkSubscription} variant="outline" className="w-full" disabled={subscription.isLoading}>
              {subscription.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Trying again...
                </>
              ) : (
                <>Try Again</>
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-6 text-sm text-muted-foreground">
          <p>If this problem persists, please contact support.</p>
        </div>
      </div>
    )
  }

  if (subscription.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading subscription information...</p>
        </div>
      </div>
    )
  }

  const isSubscriptionCanceled = subscription.canceledAt !== null || subscription.subscriptionStatus === "canceled"
  const isSubscriptionActive = subscription.isSubscribed && !isSubscriptionCanceled
  const hasRemainingAccess =
    isSubscriptionCanceled && subscription.subscriptionEnd && new Date(subscription.subscriptionEnd) > new Date()
  const isLifetimePlan = subscription.subscriptionStatus === "lifetime"

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <CreditCard className="mr-2 h-6 w-6 text-primary" />
          Subscription Management
        </h1>
        <p className="text-muted-foreground">Choose a plan that works for you and get full access to all features</p>
      </div>

      {/* Currency selector */}
      <div className="mb-8 flex justify-end items-center gap-2">
        <Globe2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground mr-2">Currency:</span>
        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {AVAILABLE_CURRENCIES.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.name} ({currency.code})
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="status">My Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="pt-6">
          {/* Plans grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Monthly Plan */}
            <PlanCard
              plan={SUBSCRIPTION_PLANS.MONTHLY}
              currency={selectedCurrency}
              currentPlan={subscription.planType}
              onSubscribe={(planId, price) => handleSubscribe(planId, price)}
              isProcessing={isProcessing}
            />

            {/* Quarterly Plan */}
            <PlanCard
              plan={SUBSCRIPTION_PLANS.QUARTERLY}
              currency={selectedCurrency}
              currentPlan={subscription.planType}
              onSubscribe={(planId, price) => handleSubscribe(planId, price)}
              isProcessing={isProcessing}
              featured={true}
            />

            {/* Annual Plan */}
            <PlanCard
              plan={SUBSCRIPTION_PLANS.ANNUAL}
              currency={selectedCurrency}
              currentPlan={subscription.planType}
              onSubscribe={(planId, price) => handleSubscribe(planId, price)}
              isProcessing={isProcessing}
            />

            {/* Lifetime Plan */}
            <PlanCard
              plan={SUBSCRIPTION_PLANS.LIFETIME}
              currency={selectedCurrency}
              currentPlan={subscription.planType}
              onSubscribe={(planId, price) => handleSubscribe(planId, price)}
              isProcessing={isProcessing}
            />
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>All plans include a 7-day free trial. You won't be charged until the trial ends.</p>
            <p className="mt-2">
              Questions about our plans?{" "}
              <a href="mailto:support@lwlnow.com" className="text-primary underline">
                Contact support@lwlnow.com
              </a>
            </p>
          </div>
        </TabsContent>

        <TabsContent value="status" className="pt-6 space-y-6">
          {/* Current plan info */}
          <Card className="border-2 shadow-lg overflow-hidden relative">
            {subscription.isSubscribed && !isSubscriptionCanceled && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 rounded-bl-md">
                <span className="flex items-center text-xs font-semibold">
                  <Shield className="mr-1 h-3 w-3" /> ACTIVE
                </span>
              </div>
            )}

            {isSubscriptionCanceled && hasRemainingAccess && (
              <div className="absolute top-0 right-0 bg-amber-500 text-white px-4 py-1 rounded-bl-md">
                <span className="flex items-center text-xs font-semibold">
                  <Ban className="mr-1 h-3 w-3" /> CANCELED
                </span>
              </div>
            )}

            <CardHeader>
              <CardTitle>
                {subscription.isSubscribed ? (isLifetimePlan ? "Lifetime Access" : "Premium Plan") : "Free Plan"}
                {subscription.planType && !isLifetimePlan && (
                  <Badge variant="outline" className="ml-2">
                    {subscription.planType.charAt(0).toUpperCase() + subscription.planType.slice(1)}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isSubscriptionActive
                  ? subscription.subscriptionStatus === "trialing"
                    ? "You are currently on a free trial"
                    : isLifetimePlan
                      ? "You have lifetime access to all premium features"
                      : "You have access to all premium features"
                  : isSubscriptionCanceled && hasRemainingAccess
                    ? "Your subscription was canceled but access remains until the end of the billing period"
                    : "Limited access to features"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {subscription.isSubscribed ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">
                      {isLifetimePlan ? (
                        "Lifetime Access"
                      ) : (
                        <>
                          {formatPrice(
                            subscription.planType === "monthly"
                              ? 4.99
                              : subscription.planType === "quarterly"
                                ? 12.99
                                : subscription.planType === "annual"
                                  ? 44.99
                                  : 4.99,
                            selectedCurrency,
                          )}{" "}
                          /
                          {subscription.planType === "monthly"
                            ? " month"
                            : subscription.planType === "quarterly"
                              ? " quarter"
                              : subscription.planType === "annual"
                                ? " year"
                                : " month"}
                        </>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {subscription.subscriptionStatus === "trialing"
                        ? "Your card will be charged after the trial ends"
                        : isSubscriptionCanceled
                          ? "Your subscription has been canceled"
                          : isLifetimePlan
                            ? "One-time payment, no recurring charges"
                            : "Recurring subscription"}
                    </p>
                  </div>

                  {subscription.subscriptionStatus === "trialing" && subscription.trialEnd && (
                    <div className="flex items-start space-x-2 p-3 bg-muted/50 rounded-md">
                      <CalendarClock className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Free Trial Period</p>
                        <p className="text-sm">
                          Your free trial ends {formatDistanceToNow(subscription.trialEnd, { addSuffix: true })}
                          <br />
                          <span className="text-xs text-muted-foreground">{format(subscription.trialEnd, "PPP")}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {isSubscriptionCanceled && subscription.canceledAt && (
                    <div className="flex items-start space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
                      <Ban className="h-5 w-5 text-amber-500 dark:text-amber-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-700 dark:text-amber-400">Subscription Canceled</p>
                        <p className="text-sm dark:text-amber-300/80">
                          Canceled on {format(subscription.canceledAt, "PPP")}
                        </p>
                      </div>
                    </div>
                  )}

                  {subscription.subscriptionEnd && !isLifetimePlan && (
                    <div className="flex items-start space-x-2 p-3 bg-muted/50 rounded-md">
                      <CalendarClock className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">{isSubscriptionCanceled ? "Access ends on" : "Next billing date"}</p>
                        <p className="text-sm">
                          {format(subscription.subscriptionEnd, "PPP")}
                          {isSubscriptionCanceled && (
                            <span className="block text-xs text-muted-foreground mt-1">
                              You will have premium access until this date
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <h4 className="font-medium flex items-center">
                      <Award className="mr-2 h-4 w-4 text-primary" />
                      Premium Features
                    </h4>
                    <ul className="space-y-1">
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span>Access to all available languages</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span>Unlimited exercises</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span>Unlimited vocabulary lists</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span>Edit exercises anytime</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span>Advanced Audio generation for all exercises</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span>AI-powered vocabulary card creation</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span>Exporting (Audio and Flashcards)</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span>Ready-to-use exercises (frequently updated)</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span>Unlimited Reading Analysis for each exercise</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Free</h3>
                    <p className="text-sm text-muted-foreground">Limited access to features</p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="font-medium">Features</h4>
                    <ul className="space-y-1">
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span>3 exercises</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span>5 vocabulary entries</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span>Progress Tracking</span>
                      </li>
                      <li className="flex items-center">
                        <X className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-muted-foreground">Advanced Audio generation</span>
                      </li>
                      <li className="flex items-center">
                        <X className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-muted-foreground">AI-powered vocabulary</span>
                      </li>
                      <li className="flex items-center">
                        <X className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-muted-foreground">Unlimited exercises</span>
                      </li>
                      <li className="flex items-center">
                        <X className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-muted-foreground">Reading Analysis</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex items-start space-x-2 p-3 bg-primary/10 rounded-md">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Premium Plans Starting at {formatPrice(4.99, selectedCurrency)}/mo</p>
                      <p className="text-sm">Unlock all features with a 7-day free trial</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              {subscription.isSubscribed ? (
                <Button onClick={handleManageSubscription} variant="outline" className="w-full" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>{isSubscriptionCanceled ? "Reactivate Subscription" : "Manage Subscription"}</>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => setActiveTab("plans")}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  View Plans
                </Button>
              )}
              <Button onClick={checkSubscription} variant="ghost" className="w-full" disabled={subscription.isLoading}>
                {subscription.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>Refresh Status</>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Subscription info */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>Information about your current subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">
                      {isSubscriptionActive ? (
                        isLifetimePlan ? (
                          <span className="text-green-600">Lifetime Access</span>
                        ) : (
                          <span className="text-green-600">Active</span>
                        )
                      ) : isSubscriptionCanceled && hasRemainingAccess ? (
                        <span className="text-amber-600">
                          Canceled - Access Until {format(subscription.subscriptionEnd!, "MMM d")}
                        </span>
                      ) : (
                        <span className="text-yellow-600">Free</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-medium capitalize">{subscription.planType || "Free"}</p>
                  </div>
                  {subscription.subscriptionStatus && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Subscription Status</p>
                      <p className="font-medium capitalize">
                        {subscription.subscriptionStatus}
                        {isSubscriptionCanceled && hasRemainingAccess && (
                          <span className="text-sm text-muted-foreground ml-2">
                            (Premium access until {format(subscription.subscriptionEnd!, "MMM d")})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  {subscription.canceledAt && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Canceled On</p>
                      <p className="font-medium">{format(subscription.canceledAt, "PPP")}</p>
                    </div>
                  )}
                  {subscription.lastChecked && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="text-sm">{formatDistanceToNow(subscription.lastChecked, { addSuffix: true })}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">What happens after my free trial?</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  After your 7-day free trial ends, your subscription will automatically continue and you'll be charged
                  based on your selected plan until you cancel.
                </p>
              </div>
              <div>
                <h4 className="font-medium">How do I cancel my subscription?</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  You can cancel your subscription at any time by clicking the "Manage Subscription" button and using
                  the Stripe customer portal. Your access will continue until the end of your current billing period.
                </p>
              </div>
              <div>
                <h4 className="font-medium">Can I upgrade or downgrade my plan?</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Yes, you can change your subscription plan at any time through the Stripe customer portal. Changes
                  will be applied at the end of your current billing cycle.
                </p>
              </div>
              <div>
                <h4 className="font-medium">Will I lose my data if I cancel?</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  No, your data will be preserved. However, some premium features will become unavailable and you'll be
                  limited to the free plan restrictions.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Have more questions? Email us at{" "}
                <a href="mailto:support@lwlnow.com" className="text-primary underline">
                  support@lwlnow.com
                </a>
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Plan Card Component
interface PlanCardProps {
  plan: PlanType
  currency: string
  currentPlan: string | null
  onSubscribe: (planId: string, price: number) => void
  isProcessing: boolean
  featured?: boolean
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  currency,
  currentPlan,
  onSubscribe,
  isProcessing,
  featured = false,
}) => {
  const isActive = currentPlan === plan.id
  const convertedPrice = convertPrice(plan.price, currency)
  const isOneTime = "oneTime" in plan && plan.oneTime
  const billing = "billing" in plan ? plan.billing : undefined
  const trialDays = "trialDays" in plan ? plan.trialDays : undefined

  return (
    <Card
      className={`border-2 flex flex-col ${
        featured
          ? "border-primary shadow-lg relative overflow-hidden"
          : isActive
            ? "border-green-400/50 shadow-md"
            : "border-border"
      }`}
    >
      {featured && (
        <div className="absolute -right-12 top-5 rotate-45 bg-primary px-10 py-1 text-xs font-semibold text-white">
          Popular
        </div>
      )}

      {isActive && (
        <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 rounded-bl-lg text-xs">
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3" /> Current
          </span>
        </div>
      )}

      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{plan.emoji}</span>
          <CardTitle>{plan.name}</CardTitle>
        </div>
        <CardDescription>{plan.tagline}</CardDescription>
      </CardHeader>

      <CardContent className="flex-grow">
        <div className="space-y-4">
          <div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold">{formatPrice(convertedPrice, currency)}</span>
              <span className="text-muted-foreground ml-2">{isOneTime ? "one-time" : `/${billing}`}</span>
            </div>

            {plan.savePercent > 0 && (
              <p className="text-sm text-primary font-medium mt-1">Save {plan.savePercent}% vs monthly</p>
            )}

            {!isOneTime && trialDays && (
              <p className="text-sm text-muted-foreground mt-1">Includes {trialDays}-day free trial</p>
            )}
          </div>

          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="mt-auto">
        <Button
          className={`w-full h-12 ${featured ? "bg-gradient-to-r from-primary to-accent hover:opacity-90" : ""}`}
          disabled={isProcessing || isActive}
          onClick={() => {
            trackButtonClick(`subscribe-${plan.id}`)
            // Store the current UI price for potential use
            const currentPrice = convertedPrice
            onSubscribe(plan.id, currentPrice)
          }}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isActive ? (
            "Current Plan"
          ) : isOneTime ? (
            "Buy Lifetime Access"
          ) : (
            "Subscribe"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default SubscriptionPage
