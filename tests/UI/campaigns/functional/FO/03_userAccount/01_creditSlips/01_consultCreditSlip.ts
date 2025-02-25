// Import utils
import files from '@utils/files';
import helper from '@utils/helpers';
import testContext from '@utils/testContext';
import loginCommon from '@commonTests/BO/loginBO';

// Import commonTests
import {createAddressTest} from '@commonTests/BO/customers/address';
import {deleteCustomerTest} from '@commonTests/BO/customers/customer';
import {createAccountTest} from '@commonTests/FO/account';
import {createOrderByCustomerTest} from '@commonTests/FO/order';

// Import pages
// Import BO pages
import dashboardPage from '@pages/BO/dashboard';
import myAccountPage from '@pages/FO/myAccount';
import creditSlipsPage from '@pages/FO/myAccount/creditSlips';
import orderDetailsPage from '@pages/FO/myAccount/orderDetails';
import ordersPage from '@pages/BO/orders';
import viewOrderProductsBlockPage from '@pages/BO/orders/view/productsBlock';
import orderPageTabListBlock from '@pages/BO/orders/view/tabListBlock';
import {viewOrderBasePage} from '@pages/BO/orders/view/viewOrderBasePage';
// Import FO pages
import homePage from '@pages/FO/home';
import loginPage from '@pages/FO/login';

// Import data
import OrderStatuses from '@data/demo/orderStatuses';
import PaymentMethods from '@data/demo/paymentMethods';
import Products from '@data/demo/products';
import AddressData from '@data/faker/address';
import CustomerData from '@data/faker/customer';
import OrderData from '@data/faker/order';

import {expect} from 'chai';
import type {BrowserContext, Page} from 'playwright';

const baseContext: string = 'functional_FO_userAccount_creditSlips_consultCreditSlip';

/*
Pre-condition:
 - Create new account on FO
 - Create new address
 - Create order
Scenario:
 - Check there are no credit slips in FO'
 - Create a partial refund from the BO
 - Check there are credit slips in FO
Post condition:
 - Delete created customer
 */
describe('FO - Consult credit slip list & View PDF Credit slip & View order', async () => {
  let browserContext: BrowserContext;
  let page: Page;
  let orderReference: string;
  let creditSlipID: string;
  let dateIssued: string;
  let filePath: string;

  const customerData: CustomerData = new CustomerData();
  const addressData: AddressData = new AddressData({
    email: customerData.email,
    country: 'France',
  });
  const orderData: OrderData = new OrderData({
    customer: customerData,
    products: [
      {
        product: Products.demo_1,
        quantity: 1,
      },
    ],
    paymentMethod: PaymentMethods.wirePayment,
  });

  // Pre-condition: Create new account on FO
  createAccountTest(customerData, `${baseContext}_preTest_1`);
  // Pre-condition: Create new address
  createAddressTest(addressData, `${baseContext}_preTest_2`);
  // Pre-condition: Create order
  createOrderByCustomerTest(orderData, `${baseContext}_preTest_3`);

  // before and after functions
  before(async function () {
    browserContext = await helper.createBrowserContext(this.browser);
    page = await helper.newTab(browserContext);
  });

  after(async () => {
    await files.deleteFile(filePath);
    await helper.closeBrowserContext(browserContext);
  });

  describe('Consult Credit slip list in FO', async () => {
    describe('Check there are no credit slips in FO', async () => {
      it('should go to FO home page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goToShopFO', baseContext);

        await homePage.goTo(page, global.FO.URL);

        const result = await homePage.isHomePage(page);
        await expect(result).to.be.true;
      });

      it('should go to login page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goToLoginPage', baseContext);

        await homePage.goToLoginPage(page);

        const pageTitle = await loginPage.getPageTitle(page);
        await expect(pageTitle).to.equal(loginPage.pageTitle);
      });

      it('should login', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'loginFO', baseContext);

        await loginPage.customerLogin(page, customerData);

        const isCustomerConnected = await loginPage.isCustomerConnected(page);
        await expect(isCustomerConnected, 'Customer is not connected!').to.be.true;
      });

      it('should go to my account page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goToMyAccountPage1', baseContext);

        await homePage.goToMyAccountPage(page);

        const pageTitle = await myAccountPage.getPageTitle(page);
        await expect(pageTitle).to.equal(myAccountPage.pageTitle);
      });

      it('should go credit slips page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goToCreditSlipsPage1', baseContext);

        await myAccountPage.goToCreditSlipsPage(page);

        const pageTitle = await creditSlipsPage.getPageTitle(page);
        await expect(pageTitle).to.equal(creditSlipsPage.pageTitle);
      });

      it('should check there no credit slips', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'checkNoCreditSlips', baseContext);

        const alertInfoMessage = await creditSlipsPage.getAlertInfoMessage(page);
        await expect(alertInfoMessage).to.equal(creditSlipsPage.noCreditSlipsInfoMessage);
      });
    });

    describe('Create a partial refund from the BO', async () => {
      it('should login in BO', async function () {
        await loginCommon.loginBO(this, page);
      });

      it('should go to \'Orders > Orders\' page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goToOrdersPage', baseContext);

        await dashboardPage.goToSubMenu(
          page,
          dashboardPage.ordersParentLink,
          dashboardPage.ordersLink,
        );

        const pageTitle = await ordersPage.getPageTitle(page);
        await expect(pageTitle).to.contains(ordersPage.pageTitle);
      });

      it('should go to the first order page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goToOrderPage', baseContext);

        // View order
        await ordersPage.goToOrder(page, 1);

        const pageTitle = await viewOrderBasePage.getPageTitle(page);
        await expect(pageTitle).to.contains(viewOrderBasePage.pageTitle);
      });

      it(`should change the order status to '${OrderStatuses.paymentAccepted.name}' and check it`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'updateOrderStatus', baseContext);

        const result = await viewOrderBasePage.modifyOrderStatus(page, OrderStatuses.paymentAccepted.name);
        await expect(result).to.equal(OrderStatuses.paymentAccepted.name);
      });

      it('should check if the button \'Partial Refund\' is visible', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'checkPartialRefundButton', baseContext);

        const result = await viewOrderBasePage.isPartialRefundButtonVisible(page);
        await expect(result).to.be.true;
      });

      it('should create \'Partial refund\'', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'createPartialRefund', baseContext);

        await viewOrderBasePage.clickOnPartialRefund(page);

        const textMessage = await viewOrderProductsBlockPage.addPartialRefundProduct(page, 1, 1);
        await expect(textMessage).to.contains(viewOrderProductsBlockPage.partialRefundValidationMessage);
      });

      it('should check if \'Credit slip\' document is created', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'checkCreditSlipDocument', baseContext);

        // Get document name
        const documentType = await orderPageTabListBlock.getDocumentType(page, 3);
        await expect(documentType).to.be.equal('Credit slip');
      });

      it('should get the order reference', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'getOrderReference', baseContext);

        // Get document name
        orderReference = await viewOrderBasePage.getOrderReference(page);
        await expect(orderReference).is.not.equal('');
      });

      it('should get the identifier and the date issued of the credit slip', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'getIdentifierDateIssued', baseContext);

        // Get Credit Slip ID
        creditSlipID = await orderPageTabListBlock.getFileName(page, 3);
        await expect(creditSlipID).is.not.equal('');

        // Get Date Issued
        dateIssued = await orderPageTabListBlock.getDocumentDate(page, 3);
        await expect(dateIssued).is.not.equal('');
      });
    });

    describe('Check there are credit slips in FO', async () => {
      it('should view my shop', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'viewMyShop_1', baseContext);

        // View my shop and init pages
        page = await viewOrderBasePage.viewMyShop(page);
        await homePage.changeLanguage(page, 'en');

        const isHomePage = await homePage.isHomePage(page);
        await expect(isHomePage, 'Fail to open FO home page').to.be.true;
      });

      it('should go to my account page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goToMyAccountPage2', baseContext);

        await homePage.goToMyAccountPage(page);

        const pageTitle = await myAccountPage.getPageTitle(page);
        await expect(pageTitle).to.equal(myAccountPage.pageTitle);
      });

      it('should go credit slips page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goToCreditSlipsPage2', baseContext);

        await myAccountPage.goToCreditSlipsPage(page);

        const pageTitle = await creditSlipsPage.getPageTitle(page);
        await expect(pageTitle).to.equal(creditSlipsPage.pageTitle);
      });

      it('should check the number of credit slips', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'checkNumberCreditSlips', baseContext);

        const numberCreditSlips = await creditSlipsPage.getNumberOfCreditSlips(page);
        await expect(numberCreditSlips).to.equal(1);
      });

      it('should check that the \'Order reference, Credit Slip ID, Date Issued\' are correct', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'checkCreditSlipInfo', baseContext);

        const creditSlipOrderReference = await creditSlipsPage.getOrderReference(page, 1);
        await expect(creditSlipOrderReference).to.equal(orderReference);

        const creditSlipOrderIdentifier = await creditSlipsPage.getCreditSlipID(page, 1);
        await expect(parseInt(creditSlipOrderIdentifier.replace('#', ''), 10)).to.equal(parseInt(creditSlipID, 10));

        const creditSlipDateIssued = await creditSlipsPage.getDateIssued(page, 1);
        await expect(creditSlipDateIssued).to.equal(dateIssued);
      });

      it('should click on the PDF Icon on the "View credit slip" column', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'clickOnViewCreditSlip', baseContext);

        filePath = await creditSlipsPage.downloadCreditSlip(page, 1);

        const found = await files.doesFileExist(filePath);
        await expect(found, 'PDF file was not downloaded').to.be.true;
      });

      it('should check credit slip pdf file', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'checkCreditSlip', baseContext);

        // Check Name in pdf
        const isCreditSlip = await files.isTextInPDF(filePath, 'CREDIT SLIP');
        await expect(isCreditSlip, 'Name of the PDF \'CREDIT SLIP\' does not exist in credit slip')
          .to.be.true;

        // Check Credit Slip ID in pdf
        const creditSlipIDExist = await files.isTextInPDF(filePath, creditSlipID);
        await expect(creditSlipIDExist, `Credit Slip ID ${creditSlipID}' does not exist in credit slip`)
          .to.be.true;

        // Check DateIssued in pdf
        const dateIssuedExist = await files.isTextInPDF(filePath, dateIssued);
        await expect(dateIssuedExist, `Date Issued '${dateIssued}' does not exist in credit slip`)
          .to.be.true;

        // Check Order Reference in pdf
        const orderReferenceExist = await files.isTextInPDF(filePath, orderReference);
        await expect(orderReferenceExist, `Order Reference '${orderReference}' does not exist in credit slip`)
          .to.be.true;

        // Check payment method in pdf
        const paymentMethodExist = await files.isTextInPDF(filePath, PaymentMethods.wirePayment.displayName);
        await expect(
          paymentMethodExist,
          `Payment Method '${PaymentMethods.wirePayment.displayName}' does not exist in credit slip`,
        ).to.be.true;
      });

      it('should click on the order Reference link', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'clickOrderReferenceLink', baseContext);

        await creditSlipsPage.clickOrderReference(page, 1);

        const pageTitle = await orderDetailsPage.getPageTitle(page);
        await expect(pageTitle).to.equal(orderDetailsPage.pageTitle);
      });

      it('should go to credit slips page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goToCreditSlipsPage3', baseContext);

        await homePage.goToMyAccountPage(page);

        const myAccountPageTitle = await myAccountPage.getPageTitle(page);
        await expect(myAccountPageTitle).to.equal(myAccountPage.pageTitle);

        await myAccountPage.goToCreditSlipsPage(page);

        const creditSlipsPageTitle = await creditSlipsPage.getPageTitle(page);
        await expect(creditSlipsPageTitle).to.equal(creditSlipsPage.pageTitle);
      });

      it('should click on the "Back to your account" link', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'clickBackToYourAccountLink', baseContext);

        await creditSlipsPage.clickBackToYourAccountLink(page);

        const myAccountPageTitle = await myAccountPage.getPageTitle(page);
        await expect(myAccountPageTitle).to.equal(myAccountPage.pageTitle);
      });

      it('should go to credit slips page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goToCreditSlipsPage4', baseContext);

        await homePage.goToMyAccountPage(page);

        const myAccountPageTitle = await myAccountPage.getPageTitle(page);
        await expect(myAccountPageTitle).to.equal(myAccountPage.pageTitle);

        await myAccountPage.goToCreditSlipsPage(page);

        const creditSlipsPageTitle = await creditSlipsPage.getPageTitle(page);
        await expect(creditSlipsPageTitle).to.equal(creditSlipsPage.pageTitle);
      });

      it('should click on the "Home" link', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'clickHomeLink', baseContext);

        await creditSlipsPage.clickHomeLink(page);

        const homePageTitle = await homePage.getPageTitle(page);
        await expect(homePageTitle).to.equal(homePage.pageTitle);
      });
    });
  });

  // Post-condition: Delete the created customer account
  deleteCustomerTest(customerData, `${baseContext}_postTest`);
});
