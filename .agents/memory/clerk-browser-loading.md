---
name: Clerk browser loading fallback
description: Behavior and recovery messaging when the custom Clerk UI never reaches isLoaded in a browser.
---

If a custom Clerk form remains in `isLoaded === false` on a published site, especially in Brave, treat browser protection of Clerk's external script/FAPI as a possible cause. The form must not leave its primary button disabled forever.

**Why:** A Brave mobile screenshot showed the auth load timeout error while the button still said “Загружаем вход…”, making the failure look like an infinite app hang.

**How to apply:** After a finite auth-load timeout, enable a reload action and explain that Brave Shields may need to be disabled for the site or the page opened in Safari/Chrome. Keep the normal Clerk loading state unchanged before the timeout.