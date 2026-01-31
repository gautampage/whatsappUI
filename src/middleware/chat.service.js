import { callPostApi } from "./api.service";
import ApiAuthWrapper from "./apiAuthWrapper";
import { Endpoints } from "./endpoints";

const ES_ENV = process.env.NEXT_PUBLIC_ES_ENV;

const getUnreadMessageApi = ApiAuthWrapper.wrapApiCall((data) => {
  return callPostApi(
    `${Endpoints.UNREAD_MESSAGE_COUNT.replace("{ES_ENV}", ES_ENV)}`,
    data,
    { skipLoader: true } // Don't show loader for scheduled polling
  );
}, "Get Unread Messages");

// Specific API for get-data polling
const getDataApi = ApiAuthWrapper.wrapApiCall((data) => {
  console.log('🔍 getDataApi called - about to call callPostApi with skipLoader: true');
  return callPostApi(
    `${Endpoints.UNREAD_MESSAGE_COUNT.replace("{ES_ENV}", ES_ENV)}`,
    data,
    { skipLoader: true } // Don't show loader for scheduled polling
  );
}, "Get Data");

const getMessagesApi = ApiAuthWrapper.wrapApiCall((data) => {
  return callPostApi(
    `${Endpoints.GET_MESSAGE.replace("{ES_ENV}", ES_ENV)}`,
    data
  );
}, "Get Messages");

const sendMessagesApi = ApiAuthWrapper.wrapApiCall((data) => {
  return callPostApi(
    `${Endpoints.SEND_MESSAGE.replace("{ES_ENV}", ES_ENV)}`,
    data
  );
}, "Send Message");

const readMessagesApi = ApiAuthWrapper.wrapApiCall((data) => {
  return callPostApi(
    `${Endpoints.READ_MESSAGE.replace("{ES_ENV}", ES_ENV)}`,
    data
  );
}, "Read Messages");

const recentMessagesApi = ApiAuthWrapper.wrapApiCall((data) => {
  return callPostApi(
    `${Endpoints.RECENT_MESSAGE.replace("{ES_ENV}", ES_ENV)}`,
    data,
    { skipLoader: true } // Don't show loader for scheduled polling
  );
}, "Recent Messages");

const getCustomerDetailsApi = ApiAuthWrapper.wrapApiCall((data) => {
  return callPostApi(
    `${Endpoints.GET_CUSTOMER_DETAILED_INFO.replace("{ES_ENV}", ES_ENV)}`,
    data
  );
}, "Get Customer Details");
const getLLMResponse = ApiAuthWrapper.wrapApiCall((data) => {
  return callPostApi(
    `${Endpoints.LLM_RESPONSE.replace("{ES_ENV}", ES_ENV)}`,
    data
  );
}, "Get LLM Response");

const getUnAssignedMessageApi = ApiAuthWrapper.wrapApiCall((data) => {
  return callPostApi(
    `${Endpoints.UNASSIGNED_MESSAGE.replace("{ES_ENV}", ES_ENV)}`,
    data,
    { skipLoader: true } // Don't show loader for scheduled polling
  );
}, "Get Unassigned Messages");

const sendRepaymentLinkApi = ApiAuthWrapper.wrapApiCall((data) => {
  return callPostApi(
    `${Endpoints.PAYMENT_LINK.replace("{ES_ENV}", ES_ENV)}`,
    data
  );
}, "Send Repayment Link");

const getSynopsisApi = (data) => {
  return callPostApi(`${Endpoints.SYNOPSIS.replace("{ES_ENV}", ES_ENV)}`, data);
};

const getActiveAgentsListApi = ApiAuthWrapper.wrapApiCall((data) => {
  return callPostApi(
    `${Endpoints.ACTIVE_AGENTS_LIST.replace("{ES_ENV}", ES_ENV)}`,
    data
  );
}, "Get Active Agents List");

const getCampaignListApi = ApiAuthWrapper.wrapApiCall((data) => {
  return callPostApi(
    `${Endpoints.CAMPAIGN_LIST.replace("{ES_ENV}", ES_ENV)}`,
    data
  );
}, "Get Campaign List");

const uploadCampaignApi = ApiAuthWrapper.wrapApiCall((data) => {
  return callPostApi(
    `${Endpoints.CAMPAIGN_LIST.replace("{ES_ENV}", ES_ENV)}`,
    data
  );
}, "Upload Campaign");

const getAccessDetailsApi = ApiAuthWrapper.wrapApiCall((data) => {
  return callPostApi(
    `${Endpoints.ACCESS_DETAILS.replace("{ES_ENV}", ES_ENV)}`,
    data
  );
}, "Get Access Details");

const dispositionApi = ApiAuthWrapper.wrapApiCall((data) => {
  return callPostApi(
    `${Endpoints.DISPOSITION.replace("{ES_ENV}", ES_ENV)}`,
    data
  );
}, "Close Conversation");

export {
    dispositionApi,
    getAccessDetailsApi,
    getActiveAgentsListApi,
    getCampaignListApi,
    getCustomerDetailsApi,
    getDataApi,
    getLLMResponse,
    getMessagesApi,
    getSynopsisApi,
    getUnAssignedMessageApi,
    getUnreadMessageApi,
    readMessagesApi,
    recentMessagesApi,
    sendMessagesApi,
    sendRepaymentLinkApi,
    uploadCampaignApi
};

