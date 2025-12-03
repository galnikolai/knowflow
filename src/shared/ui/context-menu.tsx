import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";

const ContextMenu = ContextMenuPrimitive.Root;
const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Content ref={ref} className={className} {...props} />
));
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Item ref={ref} className={className} {...props} />
));
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;

export { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem };
