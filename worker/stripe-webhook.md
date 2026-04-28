| Event | 触发时机 | 建议处理逻辑 |
| --- | --- | --- |
| checkout.session.completed | 用户通过 Checkout 成功完成支付（新订阅） | 授予访问权限、创建用户订阅记录、激活账号。 |
| customer.subscription.created | 订阅创建成功（可能 status 为 incomplete） | 记录订阅 ID、用户关联、初始状态。 |
| customer.subscription.updated | 订阅变更（升级/降级、续订、trial 结束、取消计划等） | 更新数据库中的订阅状态、计划、到期时间、处理 proration 等。 |
| customer.subscription.deleted | 订阅完全结束（取消后到期） | 撤销用户访问权限、下线账号、发送通知。 |
| invoice.paid | 发票支付成功（新订阅或续费） | 确认续费、延长访问权限、更新当前周期（强烈推荐用于续费确认，比 subscription.updated 更可靠）。 |
| invoice.payment_failed | 支付失败 | 进入 dunning（催款）流程、邮件通知用户更新支付方式、标记 past_due 状态。 |
| customer.subscription.trial_will_end | 试用期结束前 3 天 | 发送转化/续费提醒邮件 |