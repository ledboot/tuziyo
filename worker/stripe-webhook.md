| Event | Trigger | Recommended handling |
| --- | --- | --- |
| `checkout.session.completed` | A customer successfully completes Checkout for a new subscription. | Grant access, create the local subscription record, and activate the account. |
| `customer.subscription.created` | A subscription is created and may still have an `incomplete` status. | Record the subscription ID, linked user, and initial status. |
| `customer.subscription.updated` | A subscription changes through an upgrade, downgrade, renewal, trial completion, or scheduled cancellation. | Update the local status, plan, expiration date, and any proration details. |
| `customer.subscription.deleted` | A subscription fully ends after cancellation or expiration. | Revoke paid access, downgrade the account, and send any required notification. |
| `invoice.paid` | An invoice succeeds for a new subscription or renewal. | Confirm payment, extend access, and update the current billing period. Prefer this event for renewal confirmation over `customer.subscription.updated`. |
| `invoice.payment_failed` | An invoice payment fails. | Start the dunning flow, ask the customer to update their payment method, and mark the subscription as `past_due`. |
| `customer.subscription.trial_will_end` | A trial is three days from ending. | Send a trial conversion or renewal reminder. |
