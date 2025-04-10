// Mock UI components for testing

// We need to use the Jest moduleNameMapper to resolve the import paths correctly
// This will be done via jest.config.js instead of trying to mock specific paths here

// Export mock components directly for easier testing
module.exports = {
  // Basic UI components
  Button: require('./ui/button').Button,
  Input: require('./ui/input').Input,
  Select: require('./ui/select').Select,
  Badge: require('./ui/badge').Badge,
  Checkbox: require('./ui/checkbox').Checkbox,
  DropdownMenu: require('./ui/dropdown-menu').DropdownMenu,
  DropdownMenuItem: require('./ui/dropdown-menu').DropdownMenuItem,

  // Alert components
  Alert: require('./ui/alert').Alert,
  AlertTitle: require('./ui/alert').AlertTitle,
  AlertDescription: require('./ui/alert').AlertDescription,

  // Tabs components
  Tabs: require('./ui/tabs').Tabs,
  TabsList: require('./ui/tabs').TabsList,
  TabsTrigger: require('./ui/tabs').TabsTrigger,
  TabsContent: require('./ui/tabs').TabsContent,

  // Card components
  Card: require('./ui/card').Card,
  CardHeader: require('./ui/card').CardHeader,
  CardTitle: require('./ui/card').CardTitle,
  CardDescription: require('./ui/card').CardDescription,
  CardContent: require('./ui/card').CardContent,
  CardFooter: require('./ui/card').CardFooter,

  // Sheet components
  Sheet: require('./ui/sheet').Sheet,
  SheetTrigger: require('./ui/sheet').SheetTrigger,
  SheetContent: require('./ui/sheet').SheetContent,
  SheetHeader: require('./ui/sheet').SheetHeader,
  SheetTitle: require('./ui/sheet').SheetTitle,
  SheetDescription: require('./ui/sheet').SheetDescription,
  SheetFooter: require('./ui/sheet').SheetFooter,
  SheetClose: require('./ui/sheet').SheetClose,

  // Accordion components
  Accordion: require('./ui/accordion').Accordion,
  AccordionItem: require('./ui/accordion').AccordionItem,
  AccordionTrigger: require('./ui/accordion').AccordionTrigger,
  AccordionContent: require('./ui/accordion').AccordionContent,

  // Form components
  Label: require('./ui/label').Label
};