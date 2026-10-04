const fs = require('fs');
let code = fs.readFileSync('kortex_landing_page/components/SharedUI.tsx', 'utf8');

const oldDecl = `export const GeneralAlertModal = ({ title, message, type = 'info', onClose }: any) => {`;
const newDecl = `export const GeneralAlertModal = ({ title, message, type = 'info', onClose, actionLabel, onAction }: any) => {`;
code = code.replace(oldDecl, newDecl);

const oldButton = `<Button className="w-full" onClick={onClose}>Got it</Button>`;
const newButton = `<Button className="w-full" onClick={onAction || onClose}>{actionLabel || 'Got it'}</Button>`;
code = code.replace(oldButton, newButton);

fs.writeFileSync('kortex_landing_page/components/SharedUI.tsx', code);
